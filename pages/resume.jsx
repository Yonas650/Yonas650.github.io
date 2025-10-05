const myResume = '/Yonas_Resume.pdf';

const ResumePage = () => {
  return (
    <>
      <h3>Resume</h3>
      <br />
      <div style={{ height: '85vh', border: '1px solid var(--border-color)' }}>
        <iframe
          src={`${myResume}#zoom=65`}
          title="Resume"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
      <center>
        <p>
          Having trouble viewing?{' '}
          <a href={`${myResume}#zoom=65`} target="_blank" rel="noopener noreferrer">Open in new tab</a>
        </p>
      </center>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: { title: 'Resume' },
  };
}

export default ResumePage;
