import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

export const getProjectCollaborators = async (projectId, token) => {
  try {
    const response = await axios.get(`${API_URL}/project-collaborators/?project=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const inviteCollaborator = async (projectId, email, role, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/project-invitations/`,
      {
        project: projectId,
        invited_email: email,
        role: role,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeCollaborator = async (collaboratorId, token) => {
  try {
    await axios.delete(`${API_URL}/project-collaborators/${collaboratorId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw error;
  }
};

export const getMyInvitations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/project-invitations/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptInvitation = async (invitationId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/project-invitations/${invitationId}/accept/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectInvitation = async (invitationId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/project-invitations/${invitationId}/reject/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
