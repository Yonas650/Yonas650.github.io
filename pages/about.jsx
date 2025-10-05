import { pdfjs, Document, Page } from 'react-pdf';
// Use a local worker to avoid CDN errors. Place it at: public/pdfjs/pdf.worker.min.js
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const myResume = './Resume.pdf';  // make sure this points to your actual resume PDF file

const AboutPage = () => {
  return (
    <>
      <h2>About Me</h2><br/>
      {/* REAL bullets; emoji icons are visually hidden via CSS below */}
      <ul className="bullets">
        <li>
          <span role="img" aria-label="book">📖</span>
          {' '}<strong>Master of Mathematics (MMath), Computer Science</strong> at{' '}
          <a href='https://uwaterloo.ca/computer-science/'>University of Waterloo</a>{' '}
          <span>[Sep 2025 – Aug 2027]</span>
        </li>
        <li>
          <span role="img" aria-label="book">📖</span>
          {' '}B.Sc. in Computer Science (Minor in Applied Mathematics) from{' '}
          <a href='https://nyuad.nyu.edu/'>New York University Abu Dhabi</a>{' '}
          [Aug 2021 – May 2025].
        </li>

        <li>
          <span role="img" aria-label="robot">🤖</span>
          {' '}Interests: Software Development, Data Science, Machine Learning, Robots, Research.
        </li>

        <li>
          <span role="img" aria-label="laptop">💻</span>
          <span style={{ color: 'green' }}> Current Role: Graduate Research Assistant & Graduate Teaching Assistant</span>{' '}
          at the University of Waterloo.
        </li>
        <li>
          <span role="img" aria-label="laptop">💻</span>
          <span style={{ color: 'green' }}> Completed Capstone Project</span>{' '}
          at <a href='https://yasirzaki.net/'>ComNets Lab, NYUAD</a>: Enhancing Mobile Web Browsing through Real-time Image Super-Resolution.
        </li>
      </ul>
      <br/>

      <h3>Relevant Experience</h3> <br/>
      <ol className="bullets">
        <li>
          <span style={{ color: 'green' }}>Undergraduate Research Assistant</span>{' '}
          at <a href='https://aimlab-haptics.com/'>AIM lab, NYUAD</a>, developed and implemented Graph Neural Networks for EEG-based
          neurohaptic research (link prediction & graph classification) with LOSO evaluation; standardized entropy features and
          PLV/correlation edges to reduce run-to-run variance and training overhead. [May 2024 – Jul 2025, Abu Dhabi, UAE]
        </li>
        <br/>
        <li>
          <span style={{ color: 'green' }}>Tech Intern at a start-up (Project KUWA)</span>: worked as a full-stack web
          developer using the MERN stack; introduced smoke tests that reduced regression bugs by ~30%. [May 2023 – Sep 2023, Remote (Michigan)]
        </li>
        <br/>
        <li>
          <span style={{ color: 'green' }}>AI Peer Mentor</span> at{' '}
          <a href='https://nyuad.nyu.edu/en/admissions/undergraduate/why-nyu-abu-dhabi/nyuad-programs-for-high-school-students/nyuad-design-lab.html'> Design Lab: AI, NYUAD</a>:
          Mentored a team on ideation, data prep, and evaluation — the team won the Sustainable Project Award against 7 other teams. [May 2024 – Jun 2024, Abu Dhabi, UAE]
        </li>
        <br/>
      </ol>

      <h3>Additional Experience</h3> <br/>
      <ol className="bullets">
        <li>
          <span style={{ color: 'green' }}>NYUAD Art Gallery Assistant - Production and Docent</span>:
          Managed the front desk, guided tours, and assisted the exhibition design technician with special projects.
          [Sep 2022 – Jun 2023, Abu Dhabi, UAE]
        </li>
        <br/>
        <li>
          <span style={{ color: 'green' }}>Varsity Athletic Events Staff at NYU Athletics</span>:
          Guided visiting teams, coaches, opponents, and officials (Primary host responsibility for teams and VIPs).
          [Sep 2023 – Jan 2024, New York City, United States]
        </li>
      </ol>

      <center>
        <h3>Resume (<a href={myResume} download="Yonas_Atinafu_Resume.pdf">Download</a>)</h3>
        <br />
        <Document file={myResume}>
          <Page pageIndex={0} renderMode="svg"/>
        </Document>
      </center>

      {/* Scoped styles: use native bullets and hide the emoji icons visually */}
      <style jsx>{`
  /* Restore native bullets/numbers just for lists with class="bullets" */
  .bullets { padding-left: 1.25rem; }

  /* UL: solid dot bullets */
  .bullets li {
    list-style: disc !important;   /* override global list-style:none */
    margin-left: 0;
  }

  /* OL: decimal numbering */
  ol.bullets { list-style: decimal !important; }
  ol.bullets li { list-style: decimal !important; }

  /* Cancel the global star injection on the first items */
  .bullets li::before { content: none !important; }

  /* Optional: hide emoji icons so only the real bullets show */
  .bullets [role="img"] { display: none; }
`}</style>



    </>
  );
};

export async function getStaticProps() {
  return {
    props: { title: 'About' },
  };
}

export default AboutPage;
