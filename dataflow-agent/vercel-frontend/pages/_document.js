import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="utf-8" />
                <meta name="description" content="DataFlow Agent - Multi-source AI-powered data orchestration" />
                <meta name="keywords" content="AI, data aggregation, workflow, automation, Kestra" />
                <meta name="author" content="DataFlow Agent" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
