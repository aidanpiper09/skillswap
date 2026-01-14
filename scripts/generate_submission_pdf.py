from pathlib import Path

TITLE = "SkillSwap Development Process & System Diagram"

LINES = [
    TITLE,
    "",
    "Development process/methodology:",
    "1. Align to rubric & define scope (features, constraints, success metrics).",
    "2. Requirements & user stories (students, mentors, admins, moderators).",
    "3. UX planning (flows, wireframes, data model, roles & permissions).",
    "4. Architecture design (React UI, Firebase Auth, Firestore collections).",
    "5. Iterative implementation (feature slices with small, reviewable changes).",
    "6. Test & validate (auth flows, session lifecycle, ratings, admin tools).",
    "7. Security & compliance checks (data access rules, audit logging).",
    "8. Release & feedback loop (demo, collect feedback, prioritize fixes).",
    "",
    "System/application diagram:",
    "[Students/Admins]",
    "       |",
    "       v",
    "[SkillSwap Web App: React + Vite]",
    "       |  \\\\",
    "       |   \\\\",
    "       v    v",
    "[Firebase Auth]   [Firestore DB]",
    "       |            |",
    "       v            v",
    "[Session & Rating] [Profiles, Skills, Audit Logs, Messages]",
    "",
    "Notes:",
    "- Auth manages sign-in, roles, and session identity.",
    "- Firestore stores profiles, skill listings, sessions, ratings, and logs.",
]


def build_pdf(lines):
    content_lines = ["BT", "/F1 12 Tf", "72 760 Td"]
    for i, line in enumerate(lines):
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content_lines.append(f"({escaped}) Tj")
        if i != len(lines) - 1:
            content_lines.append("T*")
    content_lines.append("ET")
    stream = "\n".join(content_lines)

    objects = []
    objects.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    objects.append(
        "3 0 obj\n"
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n"
        "endobj\n"
    )
    objects.append(
        f"4 0 obj\n<< /Length {len(stream)} >>\nstream\n{stream}\nendstream\nendobj\n"
    )
    objects.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    pdf_parts = ["%PDF-1.4\n"]
    offsets = [0]
    current_offset = len(pdf_parts[0].encode("utf-8"))

    for obj in objects:
        offsets.append(current_offset)
        pdf_parts.append(obj)
        current_offset += len(obj.encode("utf-8"))

    xref_offset = current_offset
    xref_lines = ["xref\n", f"0 {len(objects) + 1}\n", "0000000000 65535 f \n"]
    for offset in offsets[1:]:
        xref_lines.append(f"{offset:010d} 00000 n \n")
    xref = "".join(xref_lines)

    trailer = (
        "trailer\n"
        f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        "startxref\n"
        f"{xref_offset}\n"
        "%%EOF\n"
    )

    pdf_parts.append(xref)
    pdf_parts.append(trailer)

    return "".join(pdf_parts)


def main():
    pdf_content = build_pdf(LINES)
    Path("submission.pdf").write_bytes(pdf_content.encode("utf-8"))


if __name__ == "__main__":
    main()
