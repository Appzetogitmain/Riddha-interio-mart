import api from '../../../shared/utils/api';

export const projectService = {
  // Get all user projects with filters & metrics
  getProjects: async (params = {}) => {
    const res = await api.get('/projects', { params });
    return res.data;
  },

  // Get project by ID
  getProjectById: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const res = await api.post('/projects', projectData);
    return res.data;
  },

  // Update project details
  updateProject: async (projectId, data) => {
    const res = await api.put(`/projects/${projectId}`, data);
    return res.data;
  },

  // Update phase status
  updatePhaseStatus: async (projectId, phaseId, data) => {
    const res = await api.put(`/projects/${projectId}/phase/${phaseId}`, data);
    return res.data;
  },

  // Update deliverable status
  updateDeliverable: async (projectId, deliverableId, data) => {
    const res = await api.put(`/projects/${projectId}/deliverable/${deliverableId}`, data);
    return res.data;
  },

  // Add budget item
  addBudgetItem: async (projectId, budgetItem) => {
    const res = await api.post(`/projects/${projectId}/budget`, budgetItem);
    return res.data;
  },

  // Get AI Health score & insights
  getProjectHealth: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/health`);
    return res.data;
  },

  // Generate project report
  generateReport: async (projectId, reportType = 'status') => {
    const res = await api.post(`/projects/${projectId}/report`, { reportType });
    return res.data;
  },

  // Email report to client
  emailReport: async (projectId, emails, reportId) => {
    const res = await api.post(`/projects/${projectId}/report/email`, { emails, reportId });
    return res.data;
  },

  // Download PDF report directly
  downloadReportPDF: async (projectId, projectName = 'Project') => {
    const res = await api.get(`/projects/${projectId}/report/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get project alerts
  getProjectAlerts: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/alerts`);
    return res.data;
  },

  // Mark alert as read
  markAlertRead: async (projectId, alertId) => {
    const res = await api.put(`/projects/${projectId}/alerts/${alertId}`, { isRead: true });
    return res.data;
  },

  // Add team member
  addTeamMember: async (projectId, userId, role) => {
    const res = await api.post(`/projects/${projectId}/team`, { userId, role });
    return res.data;
  },

  // Archive project
  archiveProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  }
};
