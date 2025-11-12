// src/components/Home.jsx
import React, { useState } from "react";
import "./styles.css"; // import custom styles

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const [docType, setDocType] = useState("sop");

  // common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [gpa, setGpa] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");

  // NEW SOP-specific fields
  const [country, setCountry] = useState("");
  const [university, setUniversity] = useState("");

  // recommender fields (LOR)
  const [recommenderName, setRecommenderName] = useState("");
  const [recommenderTitle, setRecommenderTitle] = useState("");
  const [recommenderInstitution, setRecommenderInstitution] = useState("");
  const [recommenderEmail, setRecommenderEmail] = useState("");
  const [Duration, setDuration] = useState("");
  const [CourseTaught, setCourseTaught] = useState("");
  // CV extras
  const [cvExperiences, setCvExperiences] = useState([
    { company: "", role: "", start_end: "", bullets: [""] },
  ]);
  const [cvProjects, setCvProjects] = useState([{ name: "", description: "" }]);
  const [cvEducations, setCvEducations] = useState([
    { degree: "", gpa: "", completion_date: "" },
  ]);
  const [cvLanguages, setCvLanguages] = useState([""]);
  const [cvCertificates, setCvCertificates] = useState([""]);
  const [cvAwards, setCvAwards] = useState([""]);

  // helpers
  const addExperience = () =>
    setCvExperiences([
      ...cvExperiences,
      { company: "", role: "", start_end: "", bullets: [""] },
    ]);

  const addExpBullet = (i) => {
    const copy = [...cvExperiences];
    copy[i].bullets.push("");
    setCvExperiences(copy);
  };

  const addProject = () =>
    setCvProjects([...cvProjects, { name: "", description: "" }]);

  const addEducation = () =>
    setCvEducations([...cvEducations, { degree: "", gpa: "", completion_date: "" }]);

  const addLanguage = () => setCvLanguages([...cvLanguages, ""]);
  const addCertificate = () => setCvCertificates([...cvCertificates, ""]);
  const addAward = () => setCvAwards([...cvAwards, ""]);

  const handleGenerate = async () => {
    const formData = {
      full_name: fullName,
      email,
      program,
      gpa,
      skills,
      experience,
      goal,
      country,
      university,
      recommender_name: recommenderName,
      recommender_title: recommenderTitle,
      recommender_institution: recommenderInstitution,
      recommender_email: recommenderEmail,
      Duration_cousre: Duration,
      Course_Taught:CourseTaught,
      experiences: cvExperiences,
      projects: cvProjects,
      educations: cvEducations,
      languages: cvLanguages,
      certificates: cvCertificates,
      awards: cvAwards,
    };

    try {
      const resp = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, data: formData }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        alert("Generation failed: " + (err?.error || resp.statusText));
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const nameForFile = `${(fullName || "student").replace(/\s+/g, "_")}_${docType}.pdf`;
      a.download = nameForFile;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("An error occurred while generating the document.");
    }
  };

  return (
    <div className="container">
      <h1>Document Generator — SOP / CV / LOR</h1>
      <p>
        Select the document type, fill the fields, and click Generate. The backend
        will produce a professional PDF using Gemini.
      </p>

      {/* Document Selector */}
      <div className="doc-selector">
        <button
          onClick={() => setDocType("sop")}
          className={docType === "sop" ? "active" : ""}
        >
          SOP
        </button>
        <button
          onClick={() => setDocType("cv")}
          className={docType === "cv" ? "active" : ""}
        >
          CV
        </button>
        <button
          onClick={() => setDocType("lor")}
          className={docType === "lor" ? "active" : ""}
        >
          LOR
        </button>
      </div>

      {/* Form Section */}
      <div className="form-container">
        <h2>{docType.toUpperCase()}</h2>

        <div className="grid-2">
          <div>
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Program (target)</label>
            <input value={program} onChange={(e) => setProgram(e.target.value)} />
          </div>
          <div>
            <label>GPA</label>
            <input value={gpa} onChange={(e) => setGpa(e.target.value)} />
          </div>
          <div>
            <label>Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
        </div>

        {/* ✅ Only show these for SOP */}
        {docType === "sop" && (
          <div className="grid-2">
            <div>
              <label>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <label>University</label>
              <input value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
          </div>
        )}

        <div className="full-input">
          <label>Experience (summary)</label>
          <textarea
            rows={3}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>

        <div className="full-input">
          <label>Goal / Statement of purpose (short)</label>
          <textarea
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        {docType === "cv" && (
          <>
            <hr />
            <h3>Education</h3>
            {cvEducations.map((edu, i) => (
              <div key={i} className="cv-section grid-3">
                <input
                  placeholder="Degree / Program"
                  value={edu.degree}
                  onChange={(e) => {
                    const copy = [...cvEducations];
                    copy[i].degree = e.target.value;
                    setCvEducations(copy);
                  }}
                />
                <input
                  placeholder="GPA / Marks"
                  value={edu.gpa}
                  onChange={(e) => {
                    const copy = [...cvEducations];
                    copy[i].gpa = e.target.value;
                    setCvEducations(copy);
                  }}
                />
                <input
                  placeholder="Completion Date"
                  value={edu.completion_date}
                  onChange={(e) => {
                    const copy = [...cvEducations];
                    copy[i].completion_date = e.target.value;
                    setCvEducations(copy);
                  }}
                />
              </div>
            ))}
            <button onClick={addEducation}>Add Education</button>

            <hr />
            <h3>Detailed Experiences (CV)</h3>
            {cvExperiences.map((exp, i) => (
              <div key={i} className="cv-section">
                <div className="grid-2">
                  <input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => {
                      const copy = [...cvExperiences];
                      copy[i].company = e.target.value;
                      setCvExperiences(copy);
                    }}
                  />
                  <input
                    placeholder="Role"
                    value={exp.role}
                    onChange={(e) => {
                      const copy = [...cvExperiences];
                      copy[i].role = e.target.value;
                      setCvExperiences(copy);
                    }}
                  />
                  <input
                    placeholder="Start - End"
                    value={exp.start_end}
                    onChange={(e) => {
                      const copy = [...cvExperiences];
                      copy[i].start_end = e.target.value;
                      setCvExperiences(copy);
                    }}
                  />
                </div>
                <div>
                  <label>Bullets</label>
                  {exp.bullets.map((b, bi) => (
                    <input
                      key={bi}
                      value={b}
                      onChange={(ev) => {
                        const copy = [...cvExperiences];
                        copy[i].bullets[bi] = ev.target.value;
                        setCvExperiences(copy);
                      }}
                    />
                  ))}
                  <button onClick={() => addExpBullet(i)}>Add bullet</button>
                </div>
              </div>
            ))}
            <button onClick={addExperience}>Add Experience</button>

            <hr />
            <h3>Projects</h3>
            {cvProjects.map((p, i) => (
              <div key={i} className="cv-section">
                <input
                  placeholder="Project name"
                  value={p.name}
                  onChange={(e) => {
                    const copy = [...cvProjects];
                    copy[i].name = e.target.value;
                    setCvProjects(copy);
                  }}
                />
                <textarea
                  placeholder="Description"
                  value={p.description}
                  onChange={(e) => {
                    const copy = [...cvProjects];
                    copy[i].description = e.target.value;
                    setCvProjects(copy);
                  }}
                  rows={2}
                />
              </div>
            ))}
            <button onClick={addProject}>Add Project</button>

            <hr />
            <h3>Languages</h3>
            {cvLanguages.map((lang, i) => (
              <input
                key={i}
                placeholder="Language"
                value={lang}
                onChange={(e) => {
                  const copy = [...cvLanguages];
                  copy[i] = e.target.value;
                  setCvLanguages(copy);
                }}
              />
            ))}
            <button onClick={addLanguage}>Add Language</button>

            <hr />
            <h3>Certificates</h3>
            {cvCertificates.map((cert, i) => (
              <input
                key={i}
                placeholder="Certificate"
                value={cert}
                onChange={(e) => {
                  const copy = [...cvCertificates];
                  copy[i] = e.target.value;
                  setCvCertificates(copy);
                }}
              />
            ))}
            <button onClick={addCertificate}>Add Certificate</button>

            <hr />
            <h3>Awards</h3>
            {cvAwards.map((award, i) => (
              <input
                key={i}
                placeholder="Award"
                value={award}
                onChange={(e) => {
                  const copy = [...cvAwards];
                  copy[i] = e.target.value;
                  setCvAwards(copy);
                }}
              />
            ))}
            <button onClick={addAward}>Add Award</button>
          </>
        )}

        {docType === "lor" && (
          <>
            <hr />
            <h3>Recommender information (for LOR)</h3>
            <div className="grid-2">
              <input
                placeholder="Recommender full name"
                value={recommenderName}
                onChange={(e) => setRecommenderName(e.target.value)}
              />
              <input
                placeholder="Title/Dept."
                value={recommenderTitle}
                onChange={(e) => setRecommenderTitle(e.target.value)}
              />
              <input
                placeholder="Institution"
                value={recommenderInstitution}
                onChange={(e) => setRecommenderInstitution(e.target.value)}
              />
              <input
                placeholder="Recommender email"
                value={recommenderEmail}
                onChange={(e) => setRecommenderEmail(e.target.value)}
              />
              <input
                placeholder="Course Taught"
                value={CourseTaught}
                onChange={(e) => setCourseTaught(e.target.value)}
              />
              <input
                placeholder="Duration"
                value={Duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="generate-btn">
          <button onClick={handleGenerate}>
            Generate {docType.toUpperCase()} (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
