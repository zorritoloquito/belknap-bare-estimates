'use server';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from '@/db/db';
import { estimates, customers, jobs, estimateLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { companyDetails } from '@/lib/config';
import { PDF_REDUCED_SALES_TAX_EXEMPTION_NOTE } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

export type GenerateEstimatePdfResult = 
  | { success: true; pdf: Uint8Array }
  | { success: false; error: string };

export async function generateEstimatePdf(estimateId: number): Promise<GenerateEstimatePdfResult> {
  try {
    // Fetch estimate data with related customer and job information
    const estimateData = await db
      .select({
        // Estimate fields
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        estimateDate: estimates.estimateDate,
        terms: estimates.terms,
        status: estimates.status,
        salesTaxRateType: estimates.salesTaxRateType,
        salesTaxRatePercentage: estimates.salesTaxRatePercentage,
        includeTermsAndConditions: estimates.includeTermsAndConditions,
        // Customer fields
        customerName: customers.name,
        customerAddressStreet: customers.addressStreet,
        customerAddressCity: customers.addressCity,
        customerAddressState: customers.addressState,
        customerAddressZip: customers.addressZip,
        // Job fields
        jobNameLocation: jobs.nameLocation,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .innerJoin(jobs, eq(estimates.jobId, jobs.id))
      .where(eq(estimates.id, estimateId))
      .limit(1);

    if (!estimateData.length) {
      return { success: false, error: 'Estimate not found' };
    }

    const estimate = estimateData[0];

    // Fetch line items for this estimate
    const lineItems = await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId))
      .orderBy(estimateLineItems.id);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard letter size (8.5" x 11")
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load and embed logo
    let logoImage = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'company-logo.png');
      const logoImageBytes = await fs.readFile(logoPath);
      logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch (logoError) {
      console.warn('Could not load company logo:', logoError);
      // Continue without logo
    }

    // Colors
    const black = rgb(0, 0, 0);
    const blue = rgb(0, 0.5, 1); // Blue for logo/company name

    // Page dimensions
    const { width, height } = page.getSize();
    const margin = 40;

    // Helper function to draw bordered rectangles
    const drawBox = (x: number, y: number, width: number, height: number, lineWidth = 1) => {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: black,
        borderWidth: lineWidth,
      });
    };

    // Company Header Section
    let currentY = height - margin;

    // Draw logo if available
    if (logoImage) {
      const logoSize = 50;
      page.drawImage(logoImage, {
        x: margin,
        y: currentY - logoSize,
        width: logoSize,
        height: logoSize,
      });
      
      // Company name next to logo
      page.drawText(companyDetails.name, {
        x: margin + logoSize + 15,
        y: currentY - 25,
        size: 18,
        font: helveticaBoldFont,
        color: blue,
      });
      
      currentY -= 60;
    } else {
      // Company name without logo
      page.drawText(companyDetails.name, {
        x: margin,
        y: currentY - 25,
        size: 18,
        font: helveticaBoldFont,
        color: blue,
      });
      
      currentY -= 40;
    }

    // Company address and contact info
    page.drawText(companyDetails.addressLine1, {
      x: margin,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: black,
    });

    currentY -= 15;
    page.drawText(companyDetails.phone, {
      x: margin,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: black,
    });

    currentY -= 15;
    page.drawText(companyDetails.website, {
      x: margin,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: black,
    });

    // Estimate title and info box (top right)
    const estimateBoxX = width - 200;
    const estimateBoxY = height - 80;
    const estimateBoxWidth = 160;
    const estimateBoxHeight = 60;

    // "Estimate" title
    page.drawText('Estimate', {
      x: estimateBoxX + 50,
      y: estimateBoxY + 70,
      size: 20,
      font: helveticaBoldFont,
      color: black,
    });

    // Estimate info box
    drawBox(estimateBoxX, estimateBoxY, estimateBoxWidth, estimateBoxHeight);
    
    // Date and Estimate # headers
    drawBox(estimateBoxX, estimateBoxY + 30, estimateBoxWidth / 2, 30);
    drawBox(estimateBoxX + estimateBoxWidth / 2, estimateBoxY + 30, estimateBoxWidth / 2, 30);
    
    page.drawText('Date', {
      x: estimateBoxX + 20,
      y: estimateBoxY + 45,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    page.drawText('Estimate #', {
      x: estimateBoxX + estimateBoxWidth / 2 + 10,
      y: estimateBoxY + 45,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    // Date and Estimate # values
    const formattedDate = estimate.estimateDate ? 
      new Date(estimate.estimateDate).toLocaleDateString('en-US') : 
      new Date().toLocaleDateString('en-US');

    page.drawText(formattedDate, {
      x: estimateBoxX + 15,
      y: estimateBoxY + 15,
      size: 10,
      font: helveticaFont,
      color: black,
    });

    page.drawText(estimate.estimateNumber || '', {
      x: estimateBoxX + estimateBoxWidth / 2 + 15,
      y: estimateBoxY + 15,
      size: 10,
      font: helveticaFont,
      color: black,
    });

    // Customer and Job information boxes
    currentY = height - 200;
    const boxHeight = 100;
    const leftBoxWidth = (width - 3 * margin) / 2;
    const rightBoxWidth = leftBoxWidth;

    // Customer Name/Address box
    drawBox(margin, currentY - boxHeight, leftBoxWidth, boxHeight);
    
    page.drawText('Customer Name / Address', {
      x: margin + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    // Customer details
    let customerY = currentY - 35;
    if (estimate.customerName) {
      page.drawText(estimate.customerName, {
        x: margin + 5,
        y: customerY,
        size: 10,
        font: helveticaFont,
        color: black,
      });
      customerY -= 15;
    }

    if (estimate.customerAddressStreet) {
      page.drawText(estimate.customerAddressStreet, {
        x: margin + 5,
        y: customerY,
        size: 10,
        font: helveticaFont,
        color: black,
      });
      customerY -= 15;
    }

    const cityStateZip = [
      estimate.customerAddressCity,
      estimate.customerAddressState,
      estimate.customerAddressZip
    ].filter(Boolean).join(', ');

    if (cityStateZip) {
      page.drawText(cityStateZip, {
        x: margin + 5,
        y: customerY,
        size: 10,
        font: helveticaFont,
        color: black,
      });
    }

    // Job Name/Location box
    const jobBoxX = margin + leftBoxWidth + margin;
    drawBox(jobBoxX, currentY - boxHeight, rightBoxWidth, boxHeight);
    
    page.drawText('Job Name / Location', {
      x: jobBoxX + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    if (estimate.jobNameLocation) {
      page.drawText(estimate.jobNameLocation, {
        x: jobBoxX + 5,
        y: currentY - 35,
        size: 10,
        font: helveticaFont,
        color: black,
      });
    }

    // P.O. No. and Terms section
    currentY -= boxHeight + 20;
    const smallBoxWidth = 100;
    const termsBoxWidth = width - 3 * margin - smallBoxWidth;

    // P.O. No. box
    drawBox(jobBoxX, currentY - 30, smallBoxWidth, 30);
    page.drawText('P.O. No.', {
      x: jobBoxX + 5,
      y: currentY - 15,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    // Terms box
    drawBox(jobBoxX + smallBoxWidth, currentY - 30, termsBoxWidth, 30);
    page.drawText('Terms', {
      x: jobBoxX + smallBoxWidth + 5,
      y: currentY - 15,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    if (estimate.terms) {
      page.drawText(estimate.terms, {
        x: jobBoxX + smallBoxWidth + 5,
        y: currentY - 25,
        size: 10,
        font: helveticaFont,
        color: black,
      });
    }

    // Line Items Table
    currentY -= 60;
    const tableWidth = width - 2 * margin;
    const descriptionWidth = tableWidth * 0.5;
    const qtyWidth = tableWidth * 0.1;
    const rateWidth = tableWidth * 0.2;
    const totalWidth = tableWidth * 0.2;

    // Table header
    const headerHeight = 25;
    drawBox(margin, currentY - headerHeight, tableWidth, headerHeight);

    // Header dividers
    page.drawLine({
      start: { x: margin + descriptionWidth, y: currentY },
      end: { x: margin + descriptionWidth, y: currentY - headerHeight },
      thickness: 1,
      color: black,
    });

    page.drawLine({
      start: { x: margin + descriptionWidth + qtyWidth, y: currentY },
      end: { x: margin + descriptionWidth + qtyWidth, y: currentY - headerHeight },
      thickness: 1,
      color: black,
    });

    page.drawLine({
      start: { x: margin + descriptionWidth + qtyWidth + rateWidth, y: currentY },
      end: { x: margin + descriptionWidth + qtyWidth + rateWidth, y: currentY - headerHeight },
      thickness: 1,
      color: black,
    });

    // Header text
    page.drawText('Description', {
      x: margin + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    page.drawText('Qty', {
      x: margin + descriptionWidth + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    page.drawText('Rate', {
      x: margin + descriptionWidth + qtyWidth + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    page.drawText('Total', {
      x: margin + descriptionWidth + qtyWidth + rateWidth + 5,
      y: currentY - 15,
      size: 11,
      font: helveticaBoldFont,
      color: black,
    });

    // Line items
    currentY -= headerHeight;
    const rowHeight = 20;
    let subtotal = 0;

    for (const item of lineItems) {
      // Draw row (just left and right borders, no horizontal lines between items)
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin, y: currentY - rowHeight },
        thickness: 1,
        color: black,
      });

      page.drawLine({
        start: { x: margin + tableWidth, y: currentY },
        end: { x: margin + tableWidth, y: currentY - rowHeight },
        thickness: 1,
        color: black,
      });

      // Column dividers
      page.drawLine({
        start: { x: margin + descriptionWidth, y: currentY },
        end: { x: margin + descriptionWidth, y: currentY - rowHeight },
        thickness: 1,
        color: black,
      });

      page.drawLine({
        start: { x: margin + descriptionWidth + qtyWidth, y: currentY },
        end: { x: margin + descriptionWidth + qtyWidth, y: currentY - rowHeight },
        thickness: 1,
        color: black,
      });

      page.drawLine({
        start: { x: margin + descriptionWidth + qtyWidth + rateWidth, y: currentY },
        end: { x: margin + descriptionWidth + qtyWidth + rateWidth, y: currentY - rowHeight },
        thickness: 1,
        color: black,
      });

      // Item text
      page.drawText(item.description || '', {
        x: margin + 5,
        y: currentY - 15,
        size: 9,
        font: helveticaFont,
        color: black,
      });

      const quantity = parseFloat(item.quantity || '0');
      const rate = parseFloat(item.rate || '0');
      const total = parseFloat(item.total || '0');
      
      if (quantity > 0) {
        page.drawText(quantity.toString(), {
          x: margin + descriptionWidth + 15,
          y: currentY - 15,
          size: 9,
          font: helveticaFont,
          color: black,
        });
      }

      if (rate !== 0) {
        page.drawText(rate.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 2 
        }), {
          x: margin + descriptionWidth + qtyWidth + 15,
          y: currentY - 15,
          size: 9,
          font: helveticaFont,
          color: black,
        });
      }

      page.drawText(total.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2 
      }), {
        x: margin + descriptionWidth + qtyWidth + rateWidth + 15,
        y: currentY - 15,
        size: 9,
        font: helveticaFont,
        color: black,
      });

      subtotal += total;
      currentY -= rowHeight;
    }

    // Close the table bottom
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin + tableWidth, y: currentY },
      thickness: 1,
      color: black,
    });

    // Calculate totals
    const salesTaxRate = parseFloat(estimate.salesTaxRatePercentage || '0') / 100;
    const salesTax = subtotal * salesTaxRate;
    const grandTotal = subtotal + salesTax;

    // Add totals section (if needed based on line items)
    currentY -= 40;
    
    // Sales tax line
    if (salesTax > 0) {
      const taxLabel = `Sales Tax (${estimate.salesTaxRatePercentage}%)`;
      page.drawText(taxLabel, {
        x: margin + descriptionWidth + qtyWidth,
        y: currentY,
        size: 11,
        font: helveticaBoldFont,
        color: black,
      });

      page.drawText(salesTax.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }), {
        x: margin + descriptionWidth + qtyWidth + rateWidth + 15,
        y: currentY,
        size: 11,
        font: helveticaBoldFont,
        color: black,
      });

      currentY -= 20;
    }

    // Grand total
    page.drawText('Total', {
      x: margin + descriptionWidth + qtyWidth,
      y: currentY,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });

    page.drawText(grandTotal.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }), {
      x: margin + descriptionWidth + qtyWidth + rateWidth + 15,
      y: currentY,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });

    // Footer information
    currentY -= 80;
    
    // Add signature lines section
    page.drawText('Customer/Property Owner/Authorized Agent Acceptance Signature', {
      x: margin,
      y: currentY,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    // Signature line
    page.drawLine({
      start: { x: margin + 350, y: currentY - 5 },
      end: { x: margin + 450, y: currentY - 5 },
      thickness: 1,
      color: black,
    });

    page.drawText('Date', {
      x: margin + 460,
      y: currentY,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    // Date line
    page.drawLine({
      start: { x: margin + 490, y: currentY - 5 },
      end: { x: margin + 530, y: currentY - 5 },
      thickness: 1,
      color: black,
    });

    currentY -= 30;
    
    page.drawText('Name', {
      x: margin,
      y: currentY,
      size: 10,
      font: helveticaBoldFont,
      color: black,
    });

    // Name line
    page.drawLine({
      start: { x: margin + 50, y: currentY - 5 },
      end: { x: width - margin, y: currentY - 5 },
      thickness: 1,
      color: black,
    });

    currentY -= 30;
    
    // License information
    page.drawText(`Contractors State License Board #${companyDetails.contractorsLicenseNo}`, {
      x: margin,
      y: currentY,
      size: 9,
      font: helveticaBoldFont,
      color: black,
    });

    // Sales tax note (if applicable)
    if (estimate.salesTaxRateType === 'reduced') {
      currentY -= 20;
      page.drawText(PDF_REDUCED_SALES_TAX_EXEMPTION_NOTE, {
        x: margin,
        y: currentY,
        size: 9,
        font: helveticaBoldFont,
        color: black,
        maxWidth: width - 2 * margin,
      });
    }

    // Page numbering
    page.drawText('Page 1 of 1', {
      x: width - 100,
      y: 30,
      size: 9,
      font: helveticaFont,
      color: black,
    });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    return { success: true, pdf: pdfBytes };

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to generate PDF: ${errorMessage}` };
  }
} 