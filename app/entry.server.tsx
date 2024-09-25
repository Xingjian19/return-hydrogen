import type {EntryContext, AppLoadContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    connectSrc: [
      // (ie. 'wss://<your-ngrok-domain>.app:*')
      'wss://rooster-trusting-virtually.ngrok-free.app:*',
      'https://ec2-18-118-198-174.us-east-2.compute.amazonaws.com:*',
      'https://www.google-analytics.com:*',
      'https://cognito-identity.us-east-2.amazonaws.com:*',
      'https://kinesis.us-east-2.amazonaws.com:*',
    ],
    imgSrc: [
      "'self'",
      'blob:',
      'data: base64',
      'https://img.shopoases.com',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://img.shopoases.com',
      'http://localhost:*',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
