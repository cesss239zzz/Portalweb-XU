/* ==========================================================================
   SaveWave - Configuración de Firebase
   ==========================================================================
   Reemplaza estos valores con los de TU proyecto de Firebase:
   Firebase Console -> ⚙️ Configuración del proyecto -> Tus apps -> App web
   (el objeto "firebaseConfig" que te muestra ahí se pega tal cual aquí abajo).

   Este archivo se sube al repositorio junto con el resto del código porque
   la apiKey de Firebase para apps web NO es secreta por diseño (la seguridad
   real de los datos la controlan las Reglas de Seguridad de Firestore, no
   esta clave). No pongas aquí contraseñas de administrador ni tokens.
   ========================================================================== */

export const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};
