#!/usr/bin/env node
/**
 * Spreadsheet Trigger - OpenClaw Skill
 * Reads Google Sheets and triggers WhatsApp messages
 */

const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

// Load config from OpenClaw
const config = {
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleCredsPath: process.env.GOOGLE_CREDS_PATH || './google-credentials.json',
  processedFile: './processed-leads.json',
};

// Validate E.164 phone number format
function isValidE164(phone) {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// Load processed leads
function loadProcessed() {
  if (fs.existsSync(config.processedFile)) {
    try {
      return new Set(JSON.parse(fs.readFileSync(config.processedFile, 'utf8')));
    } catch {
      return new Set();
    }
  }
  return new Set();
}

// Save processed leads
function saveProcessed(processed) {
  fs.writeFileSync(config.processedFile, JSON.stringify([...processed], null, 2));
}

// Get new leads from Google Sheets
async function getNewLeads() {
  try {
    const { GoogleSpreadsheet } = require('google-spreadsheet');
    const creds = JSON.parse(fs.readFileSync(config.googleCredsPath, 'utf8'));
    
    const doc = new GoogleSpreadsheet(config.googleSheetId);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    
    const rows = await sheet.getRows();
    
    return rows
      .filter(row => !row.Status || row.Status === 'New')
      .map(row => ({
        id: row.ID || row._rowNumber,
        name: row.Name || '',
        phone: row.Phone || '',
        email: row.Email || '',
        interest: row.Interest || '',
        _row: row,
      }))
      .filter(lead => lead.phone && lead.name && isValidE164(lead.phone));
  } catch (error) {
    console.error('Error reading Google Sheets:', error.message);
    return [];
  }
}

// Send WhatsApp message via OpenClaw
async function sendWhatsApp(lead) {
  const message = `Hi ${lead.name}! 👋

Thanks for your interest${lead.interest ? ` in ${lead.interest}` : ''}. I'd love to help you learn more!

Do you have a few minutes to chat?`;

  try {
    await execFilePromise('openclaw', [
      'message', 'send',
      '--channel', 'whatsapp',
      '--target', lead.phone,
      '--message', message,
    ]);

    console.log(`✅ Sent to ${lead.name} (${lead.phone})`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send to ${lead.phone}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Update lead status in Google Sheets
async function updateStatus(lead, status, notes) {
  try {
    if (lead._row) {
      lead._row.Status = status;
      lead._row.Notes = notes;
      lead._row['Last Updated'] = new Date().toISOString();
      await lead._row.save();
    }
  } catch (error) {
    console.error('Error updating status:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔄 Spreadsheet Trigger - Running...');
  
  const processed = loadProcessed();
  const leads = await getNewLeads();
  const newLeads = leads.filter(lead => !processed.has(lead.id));
  
  if (newLeads.length === 0) {
    console.log('   No new leads found');
    return;
  }
  
  console.log(`📊 Found ${newLeads.length} new lead(s)\n`);
  
  for (const lead of newLeads) {
    console.log(`Processing: ${lead.name}`);
    
    await updateStatus(lead, 'Processing', 'Sending WhatsApp...');
    
    const result = await sendWhatsApp(lead);
    
    if (result.success) {
      await updateStatus(lead, 'Contacted', `Sent at ${new Date().toISOString()}`);
      processed.add(lead.id);
    } else {
      await updateStatus(lead, 'Failed', `Error: ${result.error}`);
    }
    
    // Rate limiting: 2 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  saveProcessed(processed);
  console.log('\n✅ Spreadsheet trigger completed');
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
