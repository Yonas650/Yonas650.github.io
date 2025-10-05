import data from './OpenAI_API_projects.json';

export const getOpenAIAPIProjects = () => {
  return data;
};

export default (req, res) => {
  const projects = getOpenAIAPIProjects();
  res.json(projects);
};
