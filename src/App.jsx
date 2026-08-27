import { useState } from 'react'
import './App.css'
import { profile, experience, education, skills } from './resume.js'

function ExperienceItem({ job, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`job ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="job-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="job-chevron" aria-hidden="true">
          ▸
        </span>
        <span className="job-heading">
          <span className="job-title">
            {job.company} <span className="job-sep">/</span> {job.role}
          </span>
          <span className="job-meta">
            {job.dates} · {job.location}
          </span>
        </span>
      </button>
      <div className="job-body" hidden={!open}>
        <ul>
          {job.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="page">
      <header className="hero">
        <h1 className="name" tabIndex={0}>
          {profile.name}
        </h1>
        <p className="tagline">{profile.title}</p>
        <a
          className="link"
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      </header>

      <main>
        <section className="section">
          <h2 className="section-title">Experience</h2>
          <div className="jobs">
            {experience.map((job, i) => (
              <ExperienceItem key={i} job={job} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Education</h2>
          {education.map((ed, i) => (
            <div className="edu" key={i}>
              <span className="edu-school">{ed.school}</span>
              <span className="edu-degree">{ed.degree}</span>
              <span className="edu-meta">
                {ed.dates} · {ed.location}
              </span>
            </div>
          ))}
        </section>

        <section className="section">
          <h2 className="section-title">Skills</h2>
          <dl className="skills">
            {skills.map((group) => (
              <div className="skill-row" key={group.label}>
                <dt>{group.label}</dt>
                <dd>
                  {group.items.map((item) => (
                    <span className="chip" key={item}>
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  )
}

export default App
