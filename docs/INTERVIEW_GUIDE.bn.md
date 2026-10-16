# Formly নিয়ে interview প্রস্তুতি

## এক মিনিটে প্রজেক্ট বোঝানো

“Formly-তে একজন user নিজের প্রশ্ন দিয়ে form তৈরি করেন। Publish করলে একটি public link ও JavaScript snippet পান। ওই snippet অন্য website-এ বসালে floating chat widget দেখা যায়। Respondent একবারে একটি প্রশ্নের উত্তর দেন। Server উত্তর যাচাই করে PostgreSQL-এ সংরক্ষণ করে, আর form owner dashboard থেকে responses দেখেন।”

এটি ধারাবাহিক প্রশ্নের chatbot interface; কোনো AI model ব্যবহার করা হয়নি। Assignment-এ AI scope-এর বাইরে ছিল।

## যেসব সিদ্ধান্ত বুঝে রাখবে

**Next.js কেন?** একই project-এ React UI, server-rendered dashboard এবং backend Route Handlers রাখা গেছে। আলাদা backend deploy করার প্রয়োজন হয়নি।

**PostgreSQL কেন?** Users, sessions, forms ও submissions-এর সম্পর্ক, foreign keys এবং durable persistence দরকার। প্রশ্নের ordered list ও published snapshot JSONB-তে রাখা হয়েছে।

**Authentication কীভাবে?** Password সরাসরি রাখা হয় না। Random salt দিয়ে scrypt hash করা হয়। Login-এর সময় random session token তৈরি হয়; database-এ শুধু token-এর hash থাকে, browser-এ HttpOnly cookie থাকে।

**Ownership কীভাবে নিশ্চিত?** Form ID জানলেই private form দেখা যায় না। Backend query-তে form ID-এর সঙ্গে logged-in user-এর owner ID-ও মেলায়। অন্য user-কে 404 দেওয়া হয়।

**Draft আর published version আলাদা কেন?** Owner form সম্পাদনা করলেও respondent-এর চলমান conversation হঠাৎ বদলে যাওয়া উচিত নয়। Save draft নিজের editable version বদলায়; Publish আলাদা public snapshot তৈরি করে।

**পুরোনো response-এর প্রশ্ন কেন বদলায় না?** Submission-এর সঙ্গে প্রশ্নের label/type ও answer-এর snapshot রাখা হয়। Form-এর বর্তমান প্রশ্ন থেকে পুরোনো উত্তর দেখানো হয় না।

**Validation দুই জায়গায় কেন?** Browser validation দ্রুত feedback দেয়। কিন্তু কেউ সরাসরি API call করে browser check এড়িয়ে যেতে পারে। তাই server একই rules আবার যাচাই করে।

**Embed কীভাবে কাজ করে?** ছোট script floating launcher তৈরি করে। Chat UI iframe-এ চলে, তাই host website-এর CSS ফর্ম নষ্ট করে না। iframe নিজের origin-এর API-তে উত্তর পাঠায়; respondent-এর login লাগে না।

**Duplicate submission কীভাবে ঠেকানো?** প্রতিটি conversation-এর জন্য UUID তৈরি হয়। Network failure-এর পর একই request retry হলে একই ID ব্যবহার হয়, তাই দ্বিতীয় row তৈরি হয় না।

**দুই tab-এ edit করলে?** Draft revision মেলে কি না পরীক্ষা হয়। পুরোনো tab-এর save নতুন changes overwrite করতে পারে না; conflict হলে reload করতে বলে।

## Demo-র আগে নিজের হাতে পরীক্ষা

1. নিজের account তৈরি করো এবং আবার logout/login করো।
2. চার ধরনের প্রশ্নসহ একটি form বানাও।
3. Required question ফাঁকা এবং email ভুল দিয়ে validation দেখো।
4. Preview শেষ করে responses বাড়েনি নিশ্চিত করো।
5. Publish করে public link ও আলাদা embed site-এ উত্তর জমা দাও।
6. Dashboard থেকে উত্তর ও সময় দেখো।
7. Save draft বনাম Publish changes-এর পার্থক্য দেখো।
8. Unpublish করে link/widget বন্ধ এবং আগের responses অক্ষত আছে দেখো।

## কোথায় কোন code

| বিষয়                              | ফাইল                                 |
| --------------------------------- | ------------------------------------ |
| API routing                       | `src/app/api/[...path]/route.ts`     |
| Form তৈরি, save, publish ও submit | `src/lib/forms.ts`                   |
| Database/schema/connection        | `src/lib/db.ts`                      |
| Login/password/session            | `src/lib/auth.ts`                    |
| Input ও answer validation         | `src/lib/validation.ts`              |
| Form builder UI                   | `src/components/builder.tsx`         |
| Chat state ও answer flow          | `src/components/chat-form.tsx`       |
| Embed script                      | `public/embed.js`                    |
| আলাদা test website                | `examples/embed-host/index.html`     |
| Workflow tests                    | `tests/integration/workflow.test.ts` |

## উন্নতির জায়গা জিজ্ঞেস করলে

Password reset ও email verification, versioned migrations, pagination, আরও শক্তিশালী spam protection, এবং বড় project হলে runtime/migration database permissions আলাদা করা—এগুলো পরবর্তী ধাপ। বর্তমান কাজের লক্ষ্য ছিল assignment-এর সম্পূর্ণ MVP flow শেষ করা।

Interview-তে যে অংশ বোঝোনি, সেটি বোঝার চেষ্টা করে তারপর বলবে। পরীক্ষার ফল ও demo দেখিয়ে ব্যাখ্যা করা সবচেয়ে কার্যকর; পরের রাউন্ডের সিদ্ধান্ত নিয়োগকারী নেবে।
