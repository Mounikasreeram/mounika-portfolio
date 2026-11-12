const path = require('path')
 
module.exports = {
  // Make sure the resume PDF ships with the serverless chat function.
  outputFileTracingIncludes: {
    '/api/chat': ['./public/resume.pdf'],
    '/': ['./public/resume.pdf'],
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media.dev.to',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media2.dev.to',
        pathname: '**',
      },
    ],
  },
}