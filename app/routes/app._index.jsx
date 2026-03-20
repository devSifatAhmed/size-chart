import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {

  return (
    <s-page heading="Shopify app template">
      <s-section heading="Congrats on creating a new Shopify app 🎉">

      </s-section>
      <s-section heading="Get started with products">

      </s-section>

      <s-section slot="aside" heading="App template specs">

      </s-section>
      <s-section slot="aside" heading="Next steps">

      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
