import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../docs/SkillSwap_BPA_Documentation.pdf');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;

const escapePdfText = (text) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapText = (text, maxChars = 95) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (testLine.length <= maxChars) {
      line = testLine;
    } else {
      if (line) {
        lines.push(line);
      }
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const buildTextBlock = ({ lines, x, y, fontSize = 11, leading = 14 }) => {
  const escapedLines = lines.map((line) => `(${escapePdfText(line)}) Tj`);
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td ${leading} TL ${escapedLines.join(' T* ')} ET`;
};

const buildBoldText = ({ text, x, y, fontSize = 14 }) => (
  `BT /F2 ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`
);

const drawLine = (x1, y1, x2, y2) => `${x1} ${y1} m ${x2} ${y2} l S`;
const drawRect = (x, y, w, h) => `${x} ${y} ${w} ${h} re S`;

const createPageContent = (sections) => sections.filter(Boolean).join('\n');

const createPdf = ({ pages }) => {
  const objects = [];
  const offsets = [];

  const addObject = (content) => {
    const index = objects.length + 1;
    objects.push(`${index} 0 obj\n${content}\nendobj`);
    return index;
  };

  const fontObject = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldObject = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const pageObjects = [];
  const contentObjects = [];

  pages.forEach((pageContent) => {
    const stream = `<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`;
    const contentObj = addObject(stream);
    contentObjects.push(contentObj);

    const pageObj = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${fontObject} 0 R /F2 ${fontBoldObject} 0 R >> >> >>`
    );
    pageObjects.push(pageObj);
  });

  const pagesObj = addObject(
    `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjects.length} >>`
  );

  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  const header = '%PDF-1.4\n';
  let body = '';

  objects.forEach((obj) => {
    offsets.push(header.length + body.length);
    body += `${obj}\n`;
  });

  const xrefOffset = header.length + body.length;
  const xrefEntries = ['0000000000 65535 f '];
  offsets.forEach((offset) => {
    xrefEntries.push(`${String(offset).padStart(10, '0')} 00000 n `);
  });

  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries.join('\n')}\n`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(header + body + xref + trailer, 'binary');
};

const buildDocument = () => {
  const pages = [];

  const titlePage = createPageContent([
    buildBoldText({ text: 'SkillSwap Project Documentation', x: MARGIN, y: 650, fontSize: 26 }),
    buildTextBlock({
      lines: [
        'Business Professionals of America (BPA)',
        'Project: Student Talent Exchange Platform',
        'Prepared for BPA competitive submission'
      ],
      x: MARGIN,
      y: 620,
      fontSize: 12,
      leading: 16
    }),
    drawRect(MARGIN, 360, PAGE_WIDTH - MARGIN * 2, 160),
    buildTextBlock({
      lines: wrapText(
        'This document includes the project description, lifecycle and methodology, system/application diagram, database conceptual model, works cited, and BPA release forms required for submission.',
        80
      ),
      x: MARGIN + 16,
      y: 500,
      fontSize: 12,
      leading: 16
    })
  ]);
  pages.push(titlePage);

  const descriptionLines = wrapText(
    'SkillSwap is a student talent exchange platform that connects learners with peers who can teach in-demand academic or technical skills. The web application supports secure registration, profile-based skill listings, session requests, messaging, ratings, and administrative oversight to ensure a safe and accountable experience.',
    95
  );

  const lifecycleLines = wrapText(
    'The documentation follows an iterative lifecycle aligned to the application build. The team used a lightweight Agile approach with weekly checkpoints to validate requirements, design, and implementation.',
    95
  );

  const descriptionPage = createPageContent([
    buildBoldText({ text: 'Project Description', x: MARGIN, y: 720, fontSize: 16 }),
    buildTextBlock({ lines: descriptionLines, x: MARGIN, y: 690, fontSize: 11, leading: 15 }),
    buildTextBlock({
      lines: [
        '• Student dashboard with skill search, session scheduling, messaging, and rating workflows.',
        '• Role-based authentication via Firebase Auth to separate student and admin experiences.',
        '• Firestore data model for users, sessions, messages, ratings, and audit logs.',
        '• Administrative analytics with session status tracking and user management.'
      ],
      x: MARGIN,
      y: 600,
      fontSize: 11,
      leading: 15
    }),
    buildBoldText({ text: 'Document Development Lifecycle & Methodology', x: MARGIN, y: 520, fontSize: 16 }),
    buildTextBlock({ lines: lifecycleLines, x: MARGIN, y: 490, fontSize: 11, leading: 15 }),
    buildTextBlock({
      lines: [
        '• Discovery: captured user stories for students, mentors, and administrators.',
        '• Design: produced UI flows, system architecture, and data model diagrams.',
        '• Implementation: built React components, integrated Firebase Auth/Firestore, and logged admin analytics.',
        '• Testing: performed manual acceptance tests for authentication, session scheduling, and messaging workflows.',
        '• Deployment & maintenance: validated build outputs, documented operations, and prepared BPA submission assets.'
      ],
      x: MARGIN,
      y: 420,
      fontSize: 11,
      leading: 15
    })
  ]);
  pages.push(descriptionPage);

  const systemPage = createPageContent([
    buildBoldText({ text: 'System / Application Diagram', x: MARGIN, y: 720, fontSize: 16 }),
    buildTextBlock({
      lines: wrapText(
        'The SkillSwap system centers on a React web application hosted with Vite and backed by Firebase services for authentication, real-time data storage, and auditing.',
        95
      ),
      x: MARGIN,
      y: 690,
      fontSize: 11,
      leading: 15
    }),
    drawRect(70, 520, 170, 60),
    drawRect(300, 520, 170, 60),
    drawRect(70, 400, 170, 60),
    drawRect(300, 400, 170, 60),
    buildBoldText({ text: 'Client (Web App)', x: 80, y: 560, fontSize: 10 }),
    buildTextBlock({ lines: ['React + Vite UI', 'Student/Admin views'], x: 80, y: 545, fontSize: 9, leading: 12 }),
    buildBoldText({ text: 'Firebase Auth', x: 310, y: 560, fontSize: 10 }),
    buildTextBlock({ lines: ['Email/password auth', 'Role-based access'], x: 310, y: 545, fontSize: 9, leading: 12 }),
    buildBoldText({ text: 'Firestore Database', x: 80, y: 440, fontSize: 10 }),
    buildTextBlock({ lines: ['Users, Sessions', 'Messages, Ratings'], x: 80, y: 425, fontSize: 9, leading: 12 }),
    buildBoldText({ text: 'Audit & Analytics', x: 310, y: 440, fontSize: 10 }),
    buildTextBlock({ lines: ['Audit logs', 'Admin metrics'], x: 310, y: 425, fontSize: 9, leading: 12 }),
    drawLine(240, 550, 300, 550),
    drawLine(155, 520, 155, 460),
    drawLine(385, 520, 385, 460),
    buildTextBlock({ lines: ['Auth & data requests'], x: 240, y: 570, fontSize: 8, leading: 10 }),
    buildTextBlock({ lines: ['Session data'], x: 90, y: 470, fontSize: 8, leading: 10 }),
    buildTextBlock({ lines: ['Audit events'], x: 320, y: 470, fontSize: 8, leading: 10 })
  ]);
  pages.push(systemPage);

  const dataPage = createPageContent([
    buildBoldText({ text: 'Database Conceptual Model', x: MARGIN, y: 720, fontSize: 16 }),
    buildTextBlock({
      lines: wrapText(
        'The conceptual model captures the core entities and relationships that support matchmaking, communication, feedback, and administrative monitoring.',
        95
      ),
      x: MARGIN,
      y: 690,
      fontSize: 11,
      leading: 15
    }),
    drawRect(60, 520, 200, 100),
    drawRect(320, 520, 200, 100),
    drawRect(60, 350, 200, 90),
    drawRect(320, 350, 200, 90),
    drawRect(190, 200, 200, 80),
    buildBoldText({ text: 'Users', x: 70, y: 600, fontSize: 10 }),
    buildTextBlock({
      lines: ['id (uid)', 'name, email', 'role, gradYear', 'skills offered/sought', 'sessionsCompleted'],
      x: 70,
      y: 585,
      fontSize: 9,
      leading: 12
    }),
    buildBoldText({ text: 'Sessions', x: 330, y: 600, fontSize: 10 }),
    buildTextBlock({
      lines: ['id', 'requesterId', 'providerId', 'skill, location', 'status, startTime'],
      x: 330,
      y: 585,
      fontSize: 9,
      leading: 12
    }),
    buildBoldText({ text: 'Messages', x: 70, y: 430, fontSize: 10 }),
    buildTextBlock({ lines: ['id', 'sessionId', 'fromUserId', 'body, createdAt'], x: 70, y: 415, fontSize: 9, leading: 12 }),
    buildBoldText({ text: 'Ratings', x: 330, y: 430, fontSize: 10 }),
    buildTextBlock({ lines: ['id', 'sessionId', 'raterId', 'rateeId', 'score, comment'], x: 330, y: 415, fontSize: 9, leading: 12 }),
    buildBoldText({ text: 'AuditLogs', x: 200, y: 260, fontSize: 10 }),
    buildTextBlock({ lines: ['id', 'action', 'userId', 'timestamp'], x: 200, y: 245, fontSize: 9, leading: 12 }),
    drawLine(260, 570, 320, 570),
    drawLine(160, 520, 160, 440),
    drawLine(420, 520, 420, 440),
    drawLine(240, 350, 240, 250),
    drawLine(360, 350, 360, 250),
    drawLine(240, 250, 360, 250),
    buildTextBlock({ lines: ['Users participate in sessions'], x: 200, y: 580, fontSize: 8, leading: 10 }),
    buildTextBlock({ lines: ['Sessions have messages'], x: 120, y: 450, fontSize: 8, leading: 10 }),
    buildTextBlock({ lines: ['Sessions have ratings'], x: 320, y: 450, fontSize: 8, leading: 10 }),
    buildTextBlock({ lines: ['Audits track actions'], x: 240, y: 260, fontSize: 8, leading: 10 })
  ]);
  pages.push(dataPage);

  const worksPage = createPageContent([
    buildBoldText({ text: 'Works Cited', x: MARGIN, y: 720, fontSize: 16 }),
    buildTextBlock({
      lines: [
        '• Firebase Documentation. https://firebase.google.com/docs (accessed 2024-01-15).',
        '• React Documentation. https://react.dev (accessed 2024-01-15).',
        '• Vite Documentation. https://vitejs.dev/guide (accessed 2024-01-15).',
        '• Lucide React Icons. https://lucide.dev (accessed 2024-01-15).'
      ],
      x: MARGIN,
      y: 690,
      fontSize: 11,
      leading: 15
    })
  ]);
  pages.push(worksPage);

  const releasePage = createPageContent([
    buildBoldText({ text: 'BPA Release Forms', x: MARGIN, y: 720, fontSize: 16 }),
    buildBoldText({ text: 'Media Release Form', x: MARGIN, y: 690, fontSize: 12 }),
    buildTextBlock({
      lines: wrapText(
        'I grant permission for BPA and SkillSwap project staff to use photographs, video, and project materials for competition, promotion, and educational purposes. I understand no compensation is provided.',
        95
      ),
      x: MARGIN,
      y: 670,
      fontSize: 10,
      leading: 14
    }),
    drawLine(MARGIN + 120, 620, PAGE_WIDTH - MARGIN, 620),
    buildTextBlock({ lines: ['Participant Name'], x: MARGIN, y: 618, fontSize: 10, leading: 12 }),
    drawLine(MARGIN + 200, 590, PAGE_WIDTH - MARGIN, 590),
    buildTextBlock({ lines: ['Parent/Guardian (if minor)'], x: MARGIN, y: 588, fontSize: 10, leading: 12 }),
    drawLine(MARGIN + 80, 560, PAGE_WIDTH - MARGIN, 560),
    buildTextBlock({ lines: ['Signature'], x: MARGIN, y: 558, fontSize: 10, leading: 12 }),
    drawLine(MARGIN + 40, 530, PAGE_WIDTH - MARGIN, 530),
    buildTextBlock({ lines: ['Date'], x: MARGIN, y: 528, fontSize: 10, leading: 12 }),
    buildBoldText({ text: 'Project Use & Distribution Release Form', x: MARGIN, y: 490, fontSize: 12 }),
    buildTextBlock({
      lines: wrapText(
        'I authorize BPA and SkillSwap project staff to reproduce and distribute the project documentation and related materials for judging, archival, or educational use.',
        95
      ),
      x: MARGIN,
      y: 470,
      fontSize: 10,
      leading: 14
    }),
    drawLine(MARGIN + 120, 420, PAGE_WIDTH - MARGIN, 420),
    buildTextBlock({ lines: ['Participant Name'], x: MARGIN, y: 418, fontSize: 10, leading: 12 }),
    drawLine(MARGIN + 80, 390, PAGE_WIDTH - MARGIN, 390),
    buildTextBlock({ lines: ['Signature'], x: MARGIN, y: 388, fontSize: 10, leading: 12 }),
    drawLine(MARGIN + 40, 360, PAGE_WIDTH - MARGIN, 360),
    buildTextBlock({ lines: ['Date'], x: MARGIN, y: 358, fontSize: 10, leading: 12 })
  ]);
  pages.push(releasePage);

  const pdfBuffer = createPdf({ pages });
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF generated at ${outputPath}`);
};

buildDocument();
