import { pdfjs, Document, Page } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
const myResume = './Resume.pdf';  //make sure this points to your actual resume PDF file

const AboutPage = () => {
  return (
    <>
      <h3>About Me</h3><br/>
      <ul>
        <li><span role="img" aria-label="book">📖</span> B.Sc. in Computer Science and Mathematics from <a href='https://nyuad.nyu.edu/'>New York University Abu Dhabi</a> [Class of 2025].</li>
        <li><span role="img" aria-label="robot">🤖</span> Interests: Software Development, Data Science, Machine Learning, Robots, Research.</li>
        <li><span role="img" aria-label="laptop">💻</span><span style={{ color: 'green' }}> Current Role: Research Assistant</span> at <a href='https://aimlab-haptics.com/'>AIM lab, NYUAD</a> Expanding my research, focusing on refining GNN models for improved link prediction and complex graph analyses.</li>
      </ul>
      <br/>

      <h3>Computer Science Experience</h3> <br/>
      <ol>
        <li><span style={{ color: 'green' }}>Summer Research Assistant</span> at <a href='https://aimlab-haptics.com/'>AIM lab, NYUAD</a>, Developed and implemented Graph Neural Networks for EEG-based neurohaptic research, focusing on link prediction and graph classification.</li>
        <br/>
        <li><span style={{ color: 'green' }}>Tech Intern at a start-up (Project KUWA)</span>: I worked as a full-stack web developer, using MERN stack.</li>
        <br/>
        <li><span style={{ color: 'green' }}>AI Peer Mentor</span> at <a href='https://nyuad.nyu.edu/en/admissions/undergraduate/why-nyu-abu-dhabi/nyuad-programs-for-high-school-students/nyuad-design-lab.html'> Design Lab: AI, NYUAD</a>: Mentored high school students from around the world, helping them with AI projects, preparing presentations, and facilitating discussions.</li>
        <br/>
      </ol>   
      <h3>Additional Experience</h3> <br/>
      <ol>
        <li><span style={{ color: 'green' }}>NYUAD Art Gallery Assistant - Production and Docent</span>: Managed the front desk, guided tours, and assisted the exhibition design technician with special projects.</li>
        <br/>
        <li><span style={{ color: 'green' }}>Varsity Athletic Events Staff at NYU Athletics</span>: Guiding visiting teams, coaches, opponents, and officials (Primary host responsibility for teams and VIPs).</li>
      </ol>  

      <center>
        <h3>Resume (<a href={myResume} download="Yonas_Atinafu_Resume.pdf">Download</a>)</h3>
        <br />
        <Document file={myResume}>
          <Page pageIndex={0} renderMode="svg"/>
        </Document>
      </center>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: { title: 'About' },
  };
}

export default AboutPage;
