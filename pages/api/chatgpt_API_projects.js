import data from './chatgpt_API_projects.json';

export const getChatGPTAPIProjects = () => {
  return data;
};

export default (req, res) => {
  const projects = getChatGPTAPIProjects();
  res.json(projects);
};
