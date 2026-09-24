# Firebase admin management

The application grants admin access only when the signed-in Firebase Authentication user's UID has a matching document in the Firestore `admins` collection. The document ID must be the Firebase Auth UID; an email-only document is not sufficient.

## Add an admin

1. Open **Firebase Console → Authentication → Users**.
2. Create the person’s account with **Add user**, or ask them to register on the website with Google or Email/Password.
3. Copy the user’s **UID** from the Authentication user list.
4. Open **Firestore Database → Data → `admins` → Add document**.
5. Use the copied UID as the document ID and add these fields:

| Field | Type | Value |
|---|---|---|
| `id` | string | The same Firebase Auth UID |
| `email` | string | The user’s Firebase account email |
| `role` | string | `admin` |

6. Save the document. The user should sign out and sign in again; the admin panel will then appear.

An existing admin must perform this change because the Firestore rules allow writes to `admins` only for an already-authorized admin. Do not use an email address as the document ID and do not store passwords in Firestore.

## Remove an admin

Open the same document and delete it. The account remains a normal Firebase user, but it will no longer receive admin access after the next auth refresh/sign-in.

## SEO deployment notes

The Render static build generates `public/sitemap.xml` and `public/robots.txt` during `npm run build` / `pnpm build`. Set `VITE_SITE_URL` in the Render environment when using a custom domain; otherwise the default Render URL is used. Because this is a client-rendered static site, products created after deployment cannot appear in a crawler sitemap until a new build runs. Full real-time sitemap generation would require a server-side endpoint or a scheduled build.


## Delivery-link security migration

The storefront now keeps Google Drive delivery links in `productAccess/{productId}` instead of public product documents. A one-time migration runs automatically when an authorized admin opens the store after this update. Publish the current `firestore.rules` in Firebase Console before treating the change as live security protection.

For new or edited products, the Admin panel saves the public catalog separately from the purchase-gated delivery link.
