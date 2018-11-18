var slackWebHook = 'HERE PASTE YOUR SLACK WEBOOK URL';



// TIMER component

function clock() {
var timer = new Reef('#timer', {
    data: {
        time: new Date().toLocaleTimeString()
    },
    template: function (props) {
        return '<strong>The time is:</strong> <span> ' + props.time + '</span>';
    }
});
timer.render();
window.setInterval(function () {
    timer.setData({time: new Date().toLocaleTimeString()});
}, 1000);
}

clock();

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and IE 10+.
// IE: The clipboard feature may be disabled by an administrator. By
// default a prompt is shown the first time the clipboard is
// used (per session).
function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}




//
// Variables
//


var projectField = document.querySelector('#projectName');
var taskField = document.querySelector('#task');
var timeField = document.querySelector('#time');
var app;


//
// Methods
//

/**
 * Save task items to local storage
 */
var saveToLocalStorage = function () {
  localStorage.setItem('tasks', JSON.stringify(app.data.tasks));

  localStorage.setItem('username', JSON.stringify(app.data.username));
};

/**
 * Get task items from local storage
 * @return {Array} The task items (or an empty array if none exist)
 */
var getTasks = function () {
  var tasks = localStorage.getItem('tasks');
  if (tasks) return JSON.parse(tasks);
  return [];
};

/**
 * Get username from local storage
 * @return {Array} The task items (or an empty array if none exist)
 */
var getUsername = function () {
  var username = localStorage.getItem('username');
  if (username) return JSON.parse(username);
  return [];
};

/**
 * Setup the initial task list container
 */
var setup = function () {

  // Create the task list
  app = new Reef('#app', {
    data: {
      username: getUsername(),
      tasks: getTasks(),
      rapportGenerated: 0,
      rapport: ''
    },
    template: function (props) {

      // Setup the template
      var template = '';
      // Create each task item
      props.tasks.forEach(function (item, index) {

        // If it's being edited, show a form
        // Otherwise, show the item with a checkbox
        if (item.edit) {
          template +=
            '<li class="task list-group-item">' +
              '<form class="task-edit-form form-row">' +
               '<div class="form-group col-md-4">' +
                '<input type="text" class="form-control project-update" value="' + item.project + '" data-task-edit="' + index + '">' +
                '</div>' +
                '<div class="form-group col-md-4">' +
                '<input type="text" class="form-control task-update" value="' + item.task + '">' +
                '</div>' +
                '<div class="form-group col-md-3">' +
                '<input type="text" class="form-control time-update" value="' + item.time + '">' +
                '</div>' +
                '<div class="form-group col-md-1">' +
                '<button class="btn btn-success">Save</button>' +
                '</div>' +

              '</form>' +
            '</li>';
        } else {
          template +=
            '<li class="task list-group-item">' +
              '<label data-task="' + index + '">' +
                '<span class="task-item"><strong>' + item.project + '</strong> - ' + item.task + ' - ' + item.time + '</span>' +
              '</label>' +
              '<button class="task-edit ml-3 btn btn-primary">Edit</button>' +
              '<button class="task-delete ml-3 btn btn-danger">Delete</button>' +
            '</li>';
        }
      });

      // If there are task items, wrap it in an unordered list
      if (template.length > 0) {
        template = '<ul class="tasks list-group ml-0 mt-2 mb-5">' + template + '</ul><p><button class="generate-rapport btn btn-success mr-3">Generate the Slack rapport</button><button class="task-clear btn btn-danger">Clear All Tasks</button></p>';
      }

      if (props.rapportGenerated == 1) {
        template = template +
        '<div class="result">' +

        '<h2 class="text-center">Here is Your daily timesheet!</h2><p class=" text-center lead">It is also already in Your clipboard ready to be pasted into slack #timesheet channel :)</p>' +
        '<form id="slack-info" class="mt-4"><div class="form-row"><div class="form-group col-md-12"><input type="text" class="form-control" name="userName" value="' + app.data.username + '" placeholder="Your Slack name" id="userName"></div></div></form>' +
        '<div class="form-group"><textarea class="form-control" id="generated-rapport-output" rows="5">' + props.rapport + '</textarea></div>' +
        '<button class="btn btn-success mt-3 mb-5" id="sendtoslack">Send to Slack!</button>' +
        '</div>';
      }

      return template;

    }
  });
  // Render the task list
  app.render();
};

/**
 * Add a task to the list
 */
var addTask = function (event) {

  event.preventDefault();
  // Only run if there's a full item to add
  if ((projectField.value.length < 1) || (taskField.value.length < 1) || (timeField.value.length < 1)) return false;


  // Update the state
  app.data.tasks.push(
      {
        project: projectField.value,
        task: taskField.value,
        time: timeField.value
      }
);
  app.data.rapportGenerated = 0
  // Render the updated list
 app.render();

  // Clear the input fields and return to focus
  projectField.value = '';
  taskField.value = '';
  timeField.value = '';
  projectField.focus();

};


/**
 * Delete a task list item
 * @param  {Node} btn The delete button that was clicked
 */
var deleteTask = function (btn) {

  // Get the index for the task list item
  var index = btn.closest('.task').querySelector('label').getAttribute('data-task');
  if (!index) return;

  // Remove the item from state
  app.data.tasks.splice(index, 1);
  app.data.rapportGenerated = 0
  // Render the updated list
  app.render();

};

/**
 * Edit a task list item
 * @param  {Node} btn The edit button that was clicked
 */
var editTask = function (btn) {

  // Get the task list DOM element
  var taskListItem = btn.closest('.task');
  if (!taskListItem) return;

  // Get the index for the item
  var index = taskListItem.querySelector('label').getAttribute('data-task');
  if (!index) return;

  // Get the item from state
  var taskItem = app.data.tasks[index];
  if (!taskItem) return;

  // Update state
  taskItem.edit = true;


  app.data.rapportGenerated = 0
  // Render the updated UI
  app.render();

};

var saveEditTask = function (event) {

  // Prevent default form submit
  event.preventDefault();

  // Get the task list DOM node
  var newProject = event.target.querySelector('.project-update');
  var newTime = event.target.querySelector('.time-update');
  var newTask = event.target.querySelector('.task-update');
  if ((!newProject) || (!newTask) || (!newTime)) return;

  // Get the task list item index
  var index = newProject.getAttribute('data-task-edit');
  if (!index) return;

  // Get the item from state
  var taskItem = app.data.tasks[index];
  if (!taskItem) return;

  // If the item is empty, delete the task item
  // Otherwise, update it
  if (newTask.value.length < 1) {
    app.data.tasks.splice(index, 1);
  } else {
    taskItem.project = newProject.value;
    taskItem.task = newTask.value;
    taskItem.time = newTime.value;
    taskItem.edit = false;
  }

  app.data.rapportGenerated = 0

  // Render the updated list in the DOM
  app.render();

};

/**
 * Remove all task items from state
 */
var clearTasks = function () {

  // Replace the existing state with an empty array
  app.data.tasks = [];
  app.data.rapportGenerated = 0;
  // Render the updated list
  app.render();

};

/**
 * Get today date and format it
 */
var getToday = function () {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  if(dd<10) {
      dd = '0'+dd
  }
  if(mm<10) {
      mm = '0'+mm
  }
  today = dd + '/' + mm;
  return today;
}

/**
 * Generate the rapport for Slack
 */
var generateRapport = function () {
  app.data.rapportGenerated = 1;
  var data = app.data.tasks,
  today = getToday();
  var rapport = '*' + today + '*\n';

  app.data.tasks.forEach(function (item, index) {
    rapport += '• ' + item.project + ' - ' + item.task + ' : *' + item.time + '*\n'
  });
  copyToClipboard(rapport)
  app.data.rapport = rapport;
  app.data.rapportGenerated = 1;
  app.render();
};


function sendToSlack() {
  if (app.data.rapportGenerated == 0) {
    return false;
  }

  var userField = document.querySelector('#userName');
  var user = userField.value;
  if (user == '') {
    alert('Fill the Slack username field!');
    return false;
  }

  app.data.username = userField.value;
  saveToLocalStorage();

var rapportField = document.querySelector('#generated-rapport-output');

  var url = slackWebHook;
  var text = '*' + user + '*\n' + rapportField.value;
  $.ajax({
      data: 'payload=' + JSON.stringify({
          "text": text
      }),
      dataType: 'json',
      processData: false,
      type: 'POST',
      url: url,
      success: function(returnData){
           alert('Message sent - All good!');
       },
       error: function(xhr, status, error){
        if (xhr.status == 200) {
          alert('Message sent!');
        } else {
          alert('Something went wrong.. Try sending it yourself.');
        }
        }
  });
}

/**
 * Handle click events
 */
var clickHandler = function (event) {

  // Edit task
  var editBtn = event.target.closest('.task-edit');
  if (editBtn) {
    editTask(editBtn);
  }

  // Delete task
  var deleteBtn = event.target.closest('.task-delete');
  if (deleteBtn) {
    deleteTask(deleteBtn);
  }

  // Clear all tasks
  if (event.target.closest('.task-clear')) {
    clearTasks();
  }

  // Generate Slack repport
  if (event.target.closest('.generate-rapport')) {
    generateRapport();
  }

  // Generate Slack repport
  if (event.target.closest('#sendtoslack')) {
    sendToSlack();
  }


};

/**
 * Handle form submit events
 */
var submitHandler = function (event) {
  event.preventDefault();
  // If it's the "new task" form, add the item
  if (event.target.matches('#task-form')) {
    addTask(event);
  }

  // If it's the "edit task" form, save the edit
  if (event.target.matches('.task-edit-form')) {
    saveEditTask(event);
  }
};

/**
 * Handle render events
 */
var renderHandler = function (event) {

  // If the rendered element is not the #app, bail
  if (!event.target.matches('#app')) return;

  // Save the current state to localStorage
  saveToLocalStorage();

};


//
// Inits & Event Listeners
//

// Setup the DOM
setup();

// Listen for events
document.addEventListener('submit', submitHandler, false);
document.addEventListener('click', clickHandler, false);
document.addEventListener('render', renderHandler, false);




// POMODORO

function pomodoroTimer() {

var countdown;
var alarm = function () {
    var alarm = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/Yodel_Sound_Effect.mp3');
    alarm.play();
};

/**
 * Add a leading 0 if none exists
 * @param  {Integer} num The number to pad
 * @return {String}      The padded number
 */
var padLeft = function (num) {
    if (num.toString().length < 2) {
        return '0' + num;
    }
    return num;
};

/**
 * Reset the timer
 */
var reset = function () {
    timer.setData({time: 1500});
};

var tick = function () {

    // Update the timer
    timer.setData({
        time: timer.getData().time - 1,
        running: true
    });

    // If the timer reaches zero, stop and sound an alarm
    if (timer.getData().time === 0) {
        stop();
        alarm();
    }

};

/**
 * Start the timer
 */
var start = function () {

    // If the timer is at 0, reset it
    if (timer.data.time === 0) {
        reset();
    }

    // Start the timer
    tick();

    // Update the timer once a second
    countdown = window.setInterval(tick, 1000);

};

/**
 * Stop the timer
 */
var stop = function () {
    window.clearInterval(countdown);
    timer.setData({running: false});
};

/**
 * Handle click events
 */
var clickHandler = function (event) {

    // Check if a timer action button was clicked
    var action = event.target.getAttribute('data-action');
    if (!action) return;

    // If it's the start button, start the timer
    if (action === 'start') {
        start();
        return;
    }

    // If it's the stop button, stop the timer
    if (action === 'stop') {
        stop();
        return;
    }

    // If it's the clear button, reset
    if (action === 'clear') {
        stop();
        reset();
    }

};


//
// Inits & Event Listeners
//

// Create the timer
var timer = new Reef('#pomodoro', {
    data: {
        time: 1500,
        running: false
    },
    template: function (props) {
        var html =
            '<h1 id="timer">' +
                parseInt(props.time / 60, 10).toString() + ':' + padLeft(props.time % 60) +
            '</h1>' +
            '<p>' +
                '<button class="mr-2 btn btn-info" data-action="' + (props.running ? 'stop' : 'start') + '">' + (props.running ? 'Pause' : 'Start') + '</button>' +
                '<button  class="btn btn-danger" data-action="clear">Reset</button>' +
            '</p>';
        return html;
    }
});

// Render the timer into the DOM
timer.render();

// Listen for clicks
document.addEventListener('click', clickHandler, false);

};
pomodoroTimer();





function stopwatch() {
  //
  // Variables
  //

  var stopwatch, timer;

  //
  // Methods
  //

  /**
   * Format the time in seconds into hours, minutes, and seconds
   * @param  {Number} time The time in seconds
   * @return {String}      The time in hours, minutes, and seconds
   */
  var formatTime = function (time) {
      var minutes = parseInt(time / 60, 10);
      var hours = parseInt(minutes / 60, 10);
      if (minutes > 59) {
          minutes = minutes % 60;
      }
      return (hours > 0 ? hours + 'h ' : '') + (minutes > 0 || hours > 0 ? minutes + 'm ' : '') + (time % 60) + 's';
  };

  /**
   * Setup the stopwatch on page load
   */
  var setup = function () {

      // Create the stopwatch
      stopwatch = new Reef('#stopwatch', {
          data: {
              time: 0,
              running: false
          },
          template: function (props) {
              var template =
                  '<h1 id="stopwatch">' +
                      formatTime(props.time) +
                  '</h1>' +
                  '<p>' +
                      '<button class="mr-2 btn btn-info" data-stopwatch="' + (props.running ? 'stop' : 'start') + '">' + (props.running ? 'Stop' : 'Start') + '</button>' +
                      '<button class="btn btn-danger" data-stopwatch="reset">Reset</button>' +
                  '</p>';
              return template;
          }
      });

      // Render the stopwatch into the DOM
      stopwatch.render();

  };

  /**
   * Start the stopwatch
   */
  var start = function () {

      // Render immediately
      stopwatch.setData({running: true});

      // Update the timer once a second
      timer = window.setInterval(function () {
          stopwatch.setData({time: stopwatch.getData().time + 1});
      }, 1000);

  };

  /**
   * Stop the stopwatch
   */
  var stop = function () {
      window.clearInterval(timer);
      stopwatch.setData({running: false});
  };

  /**
   * Reset the stopwatch
   */
  var reset = function () {
      stopwatch.data.time = 0;
      stop();
  };

  /**
   * Handle click events
   */
  var clickHandler = function (event) {

      // Check if a stopwatch action button was clicked
      var action = event.target.getAttribute('data-stopwatch');
      if (!action) return;

      // If it's the start button, start
      if (action === 'start') {
          start();
          return;
      }

      // If it's the stop button, stop
      if (action === 'stop') {
          stop();
          return;
      }

      // If it's the stopwatch button, reset
      if (action === 'reset') {
          reset();
      }

  };


  //
  // Inits & Event Listeners
  //

  // Setup the app
  setup();

  // Listen for clicks
  document.addEventListener('click', clickHandler, false);
}

stopwatch();
