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
        <li><span role="img" aria-label="laptop">💻</span> Current Role: Research Assistant at <a href='https://engineering.nyu.edu/research-innovation/research-areas/communications-and-networking'>ComNets Lab, NYUAD</a>, working on fine-tuning machine learning models for mobile web images.</li>
      </ul>
      <br/>
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
