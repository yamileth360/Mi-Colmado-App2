  // OBJETO firebaseConfig QUE DIO LA CONSOLA DE FIREBASE
        const firebaseConfig = {
            apiKey: "AIzaSyBGJpEp-CTtCDF3UYI95Ya664PGUC4r4zQ",
            authDomain: "colmadoapp-919dd.firebaseapp.com",
            projectId: "colmadoapp-919dd",
            storageBucket: "colmadoapp-919dd.firebasestorage.app",
            messagingSenderId: "438982647094",
            appId: "1:438982647094:web:046792a0436786ff872797"
        };

         // Inicializa Firebase
        firebase.initializeApp(firebaseConfig);

        // Obtén una referencia a Firestore
        const db = firebase.firestore();

        // LOG: Confirmación de inicialización
        console.info("Firebase inicializado y conectado a Firestore.");