export const AlertService = {

  async sendSimpleAlert(commandId, details='') {

    return fetch("http://localhost:3000/alert/simple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandId, details })
    });

  },

  async requestCaregiverAssist(commandId) {

    return fetch("http://localhost:3000/alert/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandId })
    });

  }

};

