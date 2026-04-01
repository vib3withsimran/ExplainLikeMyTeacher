import Head from "next/head";
import dynamic from "next/dynamic";

const ExplainLikeMyTeacher = dynamic(() => import("../components/ExplainLikeMyTeacher"), {
  ssr: false
});

const HomePage = () => (
  <>
    <Head>
      <title>Explain Like My Teacher</title>
      <meta name="description" content="Upload a lecture video and get AI explanations that feel like your teacher." />
    </Head>
    <ExplainLikeMyTeacher />
  </>
);

export default HomePage;
