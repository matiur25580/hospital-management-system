const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function field(doc, label, value) {
  doc.font('Helvetica-Bold').fontSize(11).text(label + ': ', { continued: true });
  doc.font('Helvetica').fontSize(11).text(String(value || '-'));
  doc.moveDown(0.3);
}

function generateCasePdf(c) {
  return new Promise((resolve, reject) => {
    try {
      const filename = 'case-' + c._id + '-' + Date.now() + '.pdf';
      const filepath = path.join(__dirname, '..', 'uploads', filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(20).font('Helvetica-Bold').text('Patient Case Summary', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('gray')
        .text('Generated: ' + new Date().toLocaleString(), { align: 'center' });
      doc.fillColor('black');
      doc.moveDown();

      field(doc, 'Status', (c.status || 'new').toUpperCase());
      field(doc, 'Patient Name', c.patientName);
      field(doc, 'Email', c.patientEmail);
      field(doc, 'Age', c.age);
      field(doc, 'Gender', c.gender);
      field(doc, 'Phone', c.phone);
      field(doc, 'Address', c.address);
      field(doc, 'Disease / Chief Complaint', c.disease);
      field(doc, 'Symptoms', c.symptoms);
      field(doc, 'Duration', c.duration);
      field(doc, 'Medical History', c.medicalHistory);
      field(doc, 'Allergies', c.allergies);
      field(doc, 'Submitted At', c.submittedAt ? new Date(c.submittedAt).toLocaleString() : '');
      if (c.dischargedAt) field(doc, 'Discharged At', new Date(c.dischargedAt).toLocaleString());

      if (c.notes && c.notes.length > 0) {
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('Clinical Notes / Descriptions');
        doc.moveDown(0.5);
        c.notes.forEach((n) => {
          doc.fontSize(11).font('Helvetica-Bold')
            .text((n.role || '') + ' - ' + (n.author || '') + ' (' + (n.date ? new Date(n.date).toLocaleString() : '') + ')');
          doc.font('Helvetica').fontSize(11).text(n.text || '');
          doc.moveDown(0.5);
        });
      }

      doc.end();
      stream.on('finish', () => resolve('/uploads/' + filename));
      stream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

function generateBillPdf(c) {
  return new Promise((resolve, reject) => {
    try {
      const items = c.billItems || [];
      const fee = Number(c.doctorFee) || 0;
      const itemsTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const grand = itemsTotal + fee;
      const filename = 'bill-' + c._id + '-' + Date.now() + '.pdf';
      const filepath = path.join(__dirname, '..', 'uploads', filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(22).font('Helvetica-Bold').text('Hospital Invoice', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('black');
      doc.text('Patient: ' + c.patientName);
      doc.text('Email: ' + c.patientEmail);
      doc.text('Disease: ' + (c.disease || '-'));
      doc.text('Discharged: ' + (c.dischargedAt ? new Date(c.dischargedAt).toLocaleString() : new Date().toLocaleString()));
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Description', { continued: true }).font('Helvetica').text('Amount (Rs.)', { align: 'right' });
      doc.moveDown(0.3);
      items.forEach((it) => {
        doc.font('Helvetica').text(String(it.description || '-'), { continued: true })
          .text('Rs. ' + (Number(it.amount) || 0), { align: 'right' });
      });
      doc.text('Doctor fee', { continued: true }).text('Rs. ' + fee, { align: 'right' });
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(14).text('Total: Rs. ' + grand, { align: 'right' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').fillColor('gray')
        .text('Thank you. Get well soon!', { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve('/uploads/' + filename));
      stream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

module.exports = { generateCasePdf, generateBillPdf, generateDischargePdf };

function generateDischargePdf(c) {
  return new Promise((resolve, reject) => {
    try {
      const filename = 'discharge-' + c._id + '-' + Date.now() + '.pdf';
      const filepath = path.join(__dirname, '..', 'uploads', filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(22).font('Helvetica-Bold').text('Discharge Summary', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('gray')
        .text('Generated: ' + new Date().toLocaleString(), { align: 'center' });
      doc.fillColor('black');
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
      doc.moveDown(0.3);
      field(doc, 'Patient Name', c.patientName);
      field(doc, 'Email', c.patientEmail);
      field(doc, 'Age', c.age);
      field(doc, 'Gender', c.gender);
      field(doc, 'Phone', c.phone);

      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica-Bold').text('Admission & Discharge');
      doc.moveDown(0.3);
      field(doc, 'Admitted On', c.submittedAt ? new Date(c.submittedAt).toLocaleString() : '');
      field(doc, 'Discharged On', c.dischargedAt ? new Date(c.dischargedAt).toLocaleString() : '');
      field(doc, 'Diagnosis', c.disease);
      field(doc, 'Symptoms', c.symptoms);

      if (c.notes && c.notes.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(14).font('Helvetica-Bold').text('Treatment Summary');
        doc.moveDown(0.3);
        c.notes.forEach((n) => {
          doc.fontSize(11).font('Helvetica-Bold')
            .text((n.role || '') + ' - ' + (n.author || '') + ' (' + (n.date ? new Date(n.date).toLocaleString() : '') + ')');
          doc.font('Helvetica').fontSize(11).text(n.text || '');
          doc.moveDown(0.5);
        });
      }

      const items = c.billItems || [];
      const fee = Number(c.doctorFee) || 0;
      const itemsTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      if (items.length > 0 || fee > 0) {
        doc.moveDown(0.3);
        doc.fontSize(14).font('Helvetica-Bold').text('Billing Summary');
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        items.forEach((it) => {
          doc.text(String(it.description || '-'), { continued: true })
            .text('Rs. ' + (Number(it.amount) || 0), { align: 'right' });
        });
        doc.text('Doctor fee', { continued: true }).text('Rs. ' + fee, { align: 'right' });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(12).text('Total Billed: Rs. ' + (itemsTotal + fee), { align: 'right' });
      }

      doc.moveDown();
      doc.fontSize(10).font('Helvetica').fillColor('gray')
        .text('Follow the prescribed medication and visit for follow-up as advised.', { align: 'center' });
      doc.text('Get well soon!', { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve('/uploads/' + filename));
      stream.on('error', reject);
    } catch (e) { reject(e); }
  });
}
