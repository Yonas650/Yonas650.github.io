import Head from 'next/head';

const CustomHead = ({ title }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta
        name="description"
        content="Yonas Atinafu's Portfolio."
      />
      <meta
        name="keywords"
        content="Yonas Atinafu, software developer, machine learning, data science, web development, full-stack developer, Yonas portfolio"
      />
      <meta property="og:title" content="Yonas Atinafu's Portfolio" />
      <meta
        property="og:description"
        content="Yonas Atinafu's Portfolio showcasing skills and projects in software development and machine learning."
      />
      {/* Update og:image with a link to your own image */}
      <meta property="og:image" content="https://imgur.com/link_to_your_image.png" />
      {/* Update og:url with a link to your own portfolio URL */}
      <meta property="og:url" content="https://yourportfolio.dev" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default CustomHead;

CustomHead.defaultProps = {
  title: 'Yonas Atinafu - Portfolio',
};
