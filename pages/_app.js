import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Head from "../components/Head";
import "../styles/globals.css";
import "../styles/themes.css";
import '../styles/globals.css';
import AudioPlayer from '../components/AudioPlayer';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {

  useEffect(() => {
    if (localStorage.getItem("theme")) {
      document.documentElement.setAttribute(
        "data-theme",
        localStorage.getItem("theme")
      );
    }
  }, []);

  return (
    <Layout>
      <Head title={`Yonas Atinafu | ${pageProps.title}`} />
      {/*uncomment this if you want the music button to appear*/}
      {/*<AudioPlayer />*/}
      <Component {...pageProps} />
      <Analytics />
    </Layout>
  );
}

export default MyApp;
