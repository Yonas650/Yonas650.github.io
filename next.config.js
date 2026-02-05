const chatbotApiBaseUrl =
  process.env.CHATBOT_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ||
  '';

module.exports = {
  env: {
    CHATBOT_API_BASE_URL: chatbotApiBaseUrl,
  },
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      'avatars.githubusercontent.com',
      'imgur.com',
    ],
  }
};
