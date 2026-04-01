import Head from "next/head";
import type { AppProps } from "next/app";
import "../styles/explain.css";

const App = ({ Component, pageProps }: AppProps) => (
	<>
		<Head>
			<link
				rel="stylesheet"
				href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
				integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw=="
				crossOrigin="anonymous"
				referrerPolicy="no-referrer"
			/>
		</Head>
		<Component {...pageProps} />
	</>
);

export default App;
