# backend/server.py
import sys
import json
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
import google.generativeai as genai
import re

# 🔑 Gemini API key
GEMINI_API_KEY = "AIzaSyASbtmGTMfPqJjbRWNlti0vjLnviz_fP-s"
genai.configure(api_key=GEMINI_API_KEY)

# ---------------- PDF Helper ----------------
def create_pdf(text):
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=50
    )

    # Styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="TitleName",
        fontSize=22, leading=26,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold"
    ))
    styles.add(ParagraphStyle(
        name="TitleRole",
        fontSize=12, leading=16,
        alignment=TA_CENTER,
        fontName="Helvetica",
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="ContactInfo",
        fontSize=10, leading=14,
        alignment=TA_CENTER,
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="SubHeading",
        fontSize=12, leading=16,
        spaceAfter=6, spaceBefore=12,
        fontName="Helvetica-Bold"
    ))
    styles.add(ParagraphStyle(
        name="NormalText",
        fontSize=11, leading=16,
        alignment=TA_JUSTIFY,
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="CustomBullet",
        fontSize=11, leading=14,
        leftIndent=20, bulletIndent=10,
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="WorkHeading",
        fontSize=11, leading=14,
        spaceAfter=2, spaceBefore=6,
        fontName="Helvetica-Bold",
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="WorkSubInfo",
        fontSize=10, leading=13,
        leftIndent=15,
        textColor="black"
    ))
    styles.add(ParagraphStyle(
        name="WorkBullet",
        fontSize=11, leading=14,
        leftIndent=25, bulletIndent=15,
        textColor="black"
    ))

    flowables = []
    inside_responsibilities = False

    for para in text.split("\n"):
        line = para.strip()
        if not line:
            continue

        # ===== Centered LOR Header =====
        if re.match(r"^To Whom It May Concern", line, re.IGNORECASE):
            flowables.append(Spacer(1, 12))
            flowables.append(Paragraph(
                "<u><b><font size=16>TO WHOM IT MAY CONCERN</font></b></u>",
                ParagraphStyle(name="LORHeader", alignment=TA_CENTER)
            ))
            flowables.append(Spacer(1, 12))
            continue

        # ===== Header =====
        if line.startswith("Name:"):
            name = line.replace("Name:", "").strip()
            flowables.append(Paragraph(name, styles["TitleName"]))
            continue
        if line.startswith("Role:"):
            role = line.replace("Role:", "").strip()
            flowables.append(Paragraph(role, styles["TitleRole"]))
            continue
        if line.startswith("Contact:"):
            contact = line.replace("Contact:", "").strip()
            flowables.append(Paragraph(contact, styles["ContactInfo"]))
            flowables.append(Spacer(1, 12))
            continue

        # ===== Section Headings =====
        if re.match(r"^\*\*(.+)\*\*$", line):
            heading_text = re.sub(r"^\*\*(.+)\*\*$", r"\1", line)
            flowables.append(Spacer(1, 8))
            flowables.append(Paragraph(heading_text.upper(), styles["SubHeading"]))
            flowables.append(Spacer(1, 4))
            continue

        # ===== Work/Project Headings =====
        if line.startswith("• **") and line.endswith("**"):
            company_text = re.sub(r"• \*\*(.+)\*\*", r"\1", line)
            flowables.append(Paragraph(company_text, styles["WorkHeading"]))
            inside_responsibilities = False
            continue

        # ===== Sub-info =====
        if line.startswith("• ") and not line.startswith("• Responsibilities") and not line.startswith("• Description"):
            sub_info = line[2:].strip()
            flowables.append(Paragraph(sub_info, styles["WorkSubInfo"]))
            continue

        # ===== Responsibilities =====
        if line.startswith("• Responsibilities:") or line.startswith("• Description:"):
            flowables.append(Spacer(1, 2))
            flowables.append(Paragraph(line[2:], styles["WorkSubInfo"]))
            inside_responsibilities = True
            continue

        if inside_responsibilities and line.startswith("• "):
            resp_text = line[2:].strip()
            flowables.append(Paragraph("• " + resp_text, styles["WorkBullet"]))
            continue

        # ===== Normal bullets =====
        if line.startswith("* "):
            bullet_text = line[2:].strip()
            flowables.append(Paragraph("• " + bullet_text, styles["CustomBullet"]))
            continue

        # ===== Normal text =====
        flowables.append(Paragraph(line, styles["NormalText"]))
        flowables.append(Spacer(1, 6))

    doc.build(flowables)
    buffer.seek(0)
    return buffer


# ---------------- Prompt Builder ----------------
def build_prompt(doc_type, data):
    if doc_type == "cv":
        # 🔹 Fix: use "educations" instead of "education"
        educations = data.get("educations", [])
        edu_text = "• (No education details provided)"
        if isinstance(educations, list) and len(educations) > 0:
            edu_lines = []
            for edu in educations:
                if isinstance(edu, dict):
                    degree = edu.get("degree", "N/A")
                    gpa = edu.get("gpa", "N/A")
                    completion = edu.get("completion_date", "N/A")
                    edu_lines.append(f"• {degree} | GPA: {gpa} | Completion: {completion}")
            if edu_lines:
                edu_text = "\n".join(edu_lines)

        return f"""
Create a CV for {data.get("full_name")} following this format:

Name: {data.get("full_name")}
Contact: {data.get("email")} | GPA: {data.get("gpa")} | Phone: {data.get("phone")}

Rules:
- First line: Name (bold, large, centered)
- Second line: Role / Career Title (black, centered)
- Third line: Contact info (black, centered) including phone & email
- Do NOT include any extra "objective paragraph" under the name
- Use bold headings like **SUMMARY**, **PROFESSIONAL EXPERIENCE**, **PROJECTS**, **SKILLS**, **EDUCATION**, **ADDITIONAL INFORMATION**
- Under EDUCATION list all degrees with GPA and completion date
- Under ADDITIONAL INFORMATION include: Languages ({data.get("languages")}), Certifications ({data.get("certificates")}), Awards ({data.get("awards")})
- Do NOT include any sections after ADDITIONAL INFORMATION
- Work Experience & Projects format:
  • **Company/Project**
  • Role, Date (subtext)
  • Responsibilities/Descriptions as bullet points
- Use clean, professional formatting
- Use only black font color
- Maximum 2 pages.

Sections:
- SUMMARY: Based on {data.get("goal")}
- PROFESSIONAL EXPERIENCE: {data.get("experiences")}
- PROJECTS: {data.get("projects")}
- SKILLS: {data.get("skills")}
- EDUCATION:
{edu_text}
- ADDITIONAL INFORMATION: Languages, Certifications, Awards
"""

    if doc_type == "sop":
        return f"""
Write a Statement of Purpose in a professional format.
Rules:
- Use clear, simple English (avoid hard vocabulary).
- Use section headings in bold (like **Introduction**, **Why This Country**, etc.)
- Write in paragraphs with proper spacing.

Sections (≥120 words each):
1. Introduction
2. Why This Country
3. Why This University
4. Why This Course
5. Future Plan (student will return to home country)

Student Info:
Name: {data.get("full_name")}
Program: {data.get("program")}
Education: {data.get("educations")}
GPA: {data.get("gpa")}
Skills: {data.get("skills")}
Experience: {data.get("experience")}
Country: {data.get("country")}
University: {data.get("university")}
Goal: {data.get("goal")}
"""

    if doc_type == "lor":
        return f"""
Write a concise, professional, and formal *Letter of Recommendation (LOR)* for university admission — 
strictly between **350 and 450 words** (fit on a single A4 page).

Follow these **exact instructions**:

**Tone & Structure:**
- Academic, sincere, natural human tone (avoid robotic or exaggerated language).
- Begin with: “TO WHOM IT MAY CONCERN,” (uppercase).
- First line: “It gives me great pleasure to write this letter of recommendation for {data.get("full_name")}...”
- The recommender **has taught** the student in {data.get("Course_Taught")} during {data.get("Duration_cousre")}. 
  Never say or imply that the recommender did not teach the student.
- Maintain smooth paragraph flow and avoid bullet points or lists.
- Avoid talking too much about internships or external experiences; keep focus on academics, personality, and potential.

**Content Guidelines:**

1. **Introduction (2–3 lines):**  
   Express pleasure and honor in recommending the student for {data.get("program")} admission.

2. **Academic Observation:**  
   Mention that the recommender taught {data.get("full_name")} in {data.get("Course_Taught")} during {data.get("Duration_cousre")}.  
   Discuss the student’s class performance, learning attitude, conceptual clarity, and GPA ({data.get("gpa")}).

3. **Skills & Strengths:**  
   Highlight strong areas like {data.get("skills")}, analytical thinking, problem-solving, and teamwork.  
   Mention that the student is hardworking, disciplined, and eager to learn.

4. **Character & Personality:**  
   Describe professional attitude, communication skills, leadership, punctuality, and collaboration.  
   Mention the student’s positive influence on classmates and contributions in class.

5. **Conclusion (2–3 lines):**  
   Strongly recommend the student for admission and express confidence in future success.  
   Invite further contact for verification.

**Recommender Details:**
Name: {data.get("recommender_name")}
Title: {data.get("recommender_title")}
Institution: {data.get("recommender_institution")}
Email: {data.get("recommender_email")}

**Formatting Rules:**
- Start with “TO WHOM IT MAY CONCERN,” followed by a blank line.
- Use natural paragraphs with one blank line between them.
- End with:

Sincerely,  
{data.get("recommender_name")}  
{data.get("recommender_title")}  
{data.get("recommender_institution")}  
{data.get("recommender_email")}  

Your output must stay under one page when converted to PDF (approx. 350–450 words).
Avoid repeating experiences already mentioned in CV. Focus on academics and character.
"""
# ---------------- Main ----------------
def main():
    try:
        body = json.load(sys.stdin)
        doc_type = body.get("doc_type")
        data = body.get("data")

        print(f"[LOG] Python received request for {doc_type}", file=sys.stderr)

        # Build prompt & call Gemini
        prompt = build_prompt(doc_type, data)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        generated = response.text or "⚠️ No content generated by Gemini."

        # Clean header duplication
        header_match = re.search(r"(Name:.*?Contact:.*?)(\n|$)", generated, re.DOTALL)
        if header_match:
            header_block = header_match.group(1)
            generated = header_block + "\n" + re.sub(r"(Name:.*?Contact:.*?)(\n|$)", "", generated, flags=re.DOTALL)

        # Generate PDF
        pdf_buffer = create_pdf(generated)
        sys.stdout.buffer.write(pdf_buffer.getvalue())

        print("[LOG] PDF generated and sent to Node", file=sys.stderr)

    except Exception as e:
        print(f"❌ Python error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
