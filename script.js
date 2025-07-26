// script.js
// Handles fetching existing attendees and submitting new registrations.

/**
 * Fetch the list of attendees from the server and render them
 * in the attendeesList element.
 */
function loadAttendees() {
  fetch('/attendees')
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al obtener la lista de asistentes');
      }
      return response.json();
    })
    .then(attendees => {
      const list = document.getElementById('attendeesList');
      list.innerHTML = '';
      // Render each attendee as a list item
      attendees.forEach(attendee => {
        const li = document.createElement('li');
        const name = document.createElement('strong');
        name.textContent = attendee.name;
        li.appendChild(name);
        if (attendee.comment) {
          li.appendChild(document.createTextNode(': ' + attendee.comment));
        }
        list.appendChild(li);
      });
    })
    .catch(error => {
      console.error(error);
    });
}

/**
 * Submit the registration form via POST request to the server.
 * Prevents the default form submission behaviour.
 */
function submitRegistration(event) {
  event.preventDefault();
  const nameInput = document.getElementById('name');
  const commentInput = document.getElementById('comment');
  const name = nameInput.value.trim();
  const comment = commentInput.value.trim();
  if (!name) {
    alert('Por favor ingresa tu nombre.');
    return;
  }
  fetch('/attendees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name, comment: comment })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al registrar la asistencia');
      }
      // Reset fields
      nameInput.value = '';
      commentInput.value = '';
      // Reload attendees list
      loadAttendees();
    })
    .catch(error => {
      console.error(error);
    });
}

// Bind events on page load
document.addEventListener('DOMContentLoaded', function () {
  // Initially load attendees
  loadAttendees();
  // Attach submit handler to form
  const form = document.getElementById('registrationForm');
  form.addEventListener('submit', submitRegistration);
});