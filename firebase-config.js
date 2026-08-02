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
    apiKey: "AIzaSyD3ozHQRKmw--ewfk-v9zigI0dv7zR83fc",
    authDomain: "savewave-xu.firebaseapp.com",
    projectId: "savewave-xu",
    storageBucket: "savewave-xu.firebasestorage.app",
    messagingSenderId: "755238132422",
    appId: "1:755238132422:web:b9219455d478f7d46d15c7"
};
