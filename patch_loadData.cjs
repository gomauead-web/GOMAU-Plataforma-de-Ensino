const fs = require('fs');
let code = fs.readFileSync('src/pages/ContentPage.tsx', 'utf8');

// Replace the single try-catch in loadData with individual ones
const oldLoadData = `      try {
        // Load Contents (Files)
        const qContents = query(collection(db, 'contents'));
        const contentsSnapshot = await getDocs(qContents);
        setContents(contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem)));

        // Load Courses (Links)
        const qCourses = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(qCourses);
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseItem)));

        // Load user's own pranchas
        const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid));
        const pranchasSnapshot = await getDocs(qPranchas);
        const fetched = pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched requests for user:', fetched.length);
        setPranchas(fetched.filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)' || (p.titulo && p.titulo.toLowerCase().includes('prancha'))));

        // Load notes of studies
        await fetchUserNotes();
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'contents/courses/requests');
      } finally {
        setLoading(false);
      }`;

const newLoadData = `      try {
        const qContents = query(collection(db, 'contents'));
        const contentsSnapshot = await getDocs(qContents);
        setContents(contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem)));
      } catch (err) {
        console.error("Erro ao carregar conteúdos:", err);
      }

      try {
        const qCourses = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(qCourses);
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseItem)));
      } catch (err) {
        console.error("Erro ao carregar cursos (provavelmente restrição de permissão):", err);
      }

      try {
        const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid));
        const pranchasSnapshot = await getDocs(qPranchas);
        const fetched = pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched requests for user:', fetched.length);
        setPranchas(fetched.filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)' || (p.titulo && p.titulo.toLowerCase().includes('prancha'))));
      } catch (err) {
        console.error("Erro ao carregar pranchas:", err);
      }

      try {
        await fetchUserNotes();
      } catch (err) {
        console.error("Erro ao carregar notas:", err);
      }
      
      setLoading(false);`;

code = code.replace(oldLoadData, newLoadData);
fs.writeFileSync('src/pages/ContentPage.tsx', code);
