# Five-minute reviewer walkthrough

## 1. Explore the application

Open https://formly-chat-forms.vercel.app/demo. Each visitor gets a separate workspace. The initial three responses are explicitly labeled examples; changes do not affect another reviewer's forms.

## 2. Build and preview

Choose **Create a form → Blank form**. Give it a title and add an email question, a multiple-choice question with two unique options, and a yes/no question. Use the arrows to reorder. Mark one question optional. Under **Style**, change the accent color and welcome message.

Run through **Preview**. An invalid email should show an error; an optional question can be skipped. No preview response appears in the dashboard.

## 3. Publish and embed

Choose **Publish form**. The share dialog contains a public URL and a JavaScript snippet. Open the public form, then select **Test embed**. The test site is hosted at https://formly-widget-test.vercel.app, a different origin from the application.

Open its floating chat, answer every required question, and select **Send response**. The success message should appear only after the database accepts the response.

## 4. Inspect the saved submission

Return to the builder and open **Responses**. Select **View answers** and verify the text and timestamp. **Export CSV** exports the displayed responses. The dashboard totals reflect saved data.

## 5. Check lifecycle behavior

Edit a question and **Save draft**. The public form should still show the published wording until **Publish changes** is selected. Under **Style → Unpublish form**, pause the form. The public form and widget should stop accepting responses; the existing saved submission remains visible.

For ownership checks, create two separate accounts. One cannot access the other's builder, forms or submission API. The automated integration suite covers these cases.

## Reference links

- Live application: https://formly-chat-forms.vercel.app
- Public GitHub repository: https://github.com/almuzahidseyam/formly-chat-forms
- Demo workspace: https://formly-chat-forms.vercel.app/demo
- Independent widget host: https://formly-widget-test.vercel.app

