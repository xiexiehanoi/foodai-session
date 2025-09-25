# GEMINI.md

## Project Overview

This is a Next.js web application called **FoodAI**. Its primary purpose is to provide AI-powered nutritional analysis of food from a single image. Users can sign up, log in, and upload a picture of their meal. A backend service then analyzes the image and returns information about the food, including its name, calories, protein, carbohydrates, and fat content.

The project is built with the following technologies:

*   **Framework**: [Next.js](https://nextjs.org/) (React)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Authentication & Database**: [Supabase](https://supabase.io/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Lucide React](https://lucide.dev/guide/packages/lucide-react) for icons.
*   **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
*   **AI Backend**: The application sends image data to an external webhook (likely an [n8n.io](https://n8n.io/) workflow) for processing and analysis.

The application features a user-friendly interface with a landing page for unauthenticated users and a dedicated image upload and analysis section for those who are logged in.

## Building and Running

To get the application running locally, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file by copying the `env.example` file. You will need to add your Supabase and n8n webhook credentials to this file.

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### Key Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Creates a production build of the application.
*   `npm run start`: Starts the production server.

## Development Conventions

*   **Authentication**: User authentication is handled by Supabase. The application uses both client-side and server-side Supabase helpers.
*   **Middleware**: Supabase middleware is used to manage user sessions.
*   **File Structure**:
    *   `src/app`: Contains the main application routes and pages.
    *   `src/components`: Contains reusable React components.
    *   `src/lib`: Contains utility functions and Supabase client initializations.
*   **Styling**: The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS.
*   **AI Integration**: The core AI functionality is decoupled from the main application and is accessed via a webhook. The `ImageUpload.tsx` component is responsible for handling the communication with this webhook.
