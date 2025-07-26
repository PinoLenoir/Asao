document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('confirmForm');
  const nameInput = document.getElementById('name');
  const commentInput = document.getElementById('comment');
  const attendeeList = document.getElementById('attendeeList');

  // Referencia a la rama 'attendees' en Realtime Database
  const dbRef = firebase.database().ref('attendees');

  // Escucha los cambios en la base de datos y actualiza la lista
  dbRef.on('value', snapshot => {
    attendeeList.innerHTML = '';
    snapshot.forEach(child => {
      const val = child.val();
      const li = document.createElement('li');
      li.innerHTML = `<strong>${val.name}</strong>${val.comment ? ': ' + val.comment : ''}`;
      attendeeList.appendChild(li);
    });
  });

  // Manejo del envío del formulario
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();
    if (!name) return;
    // Registrar en la base de datos
    dbRef.push({
      name: name,
      comment: comment,
      timestamp: Date.now()
    }).then(() => {
      nameInput.value = '';
      commentInput.value = '';
    }).catch(err => {
      console.error(err);
      alert('Ocurrió un error al registrar tu asistencia. Inténtalo de nuevo.');
    });
  });
});
