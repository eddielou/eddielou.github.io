export const profile = {
  name: 'Eddie Lou',
  title: 'Software Engineer · Backend & Full Stack',
  linkedin: 'https://linkedin.com/in/eddieslou',
}

export const experience = [
  {
    company: 'Chime Financial',
    role: 'Senior Software Engineer',
    dates: 'Nov 2023 – Jun 2025',
    location: 'Brooklyn, NY',
    bullets: [
      'Eliminated plain-text SSN storage from Chime’s enrollment flow, replacing it with cryptographic hashing to mitigate a major compliance audit risk as part of a company-wide data security initiative.',
      'Led backend development for an enrollment-flow experiment measuring the impact of identity verification on enrollment completion; partnered with Product & Data teams to analyze drop-off and KYC metrics.',
      'Improved enrollment on-call efficiency by redesigning runbooks and operational dashboards, making production incident investigation more streamlined and consistent.',
      'Selected for a cross-functional team of senior engineers to build the backend for MyPay at Work’s minimum sellable product, helping establish the foundation for the new product.',
    ],
  },
  {
    company: 'Google Cloud Platform',
    role: 'L4 Software Engineer',
    dates: 'Sep 2021 – Jan 2023',
    location: 'New York, NY',
    bullets: [
      'Led frontend development enabling Cloud Spanner customers to create and upgrade free-trial instances in the Google Cloud Console, driving new customer acquisition and usage — including 30+ enterprise trial account creations in the first 7 days.',
      'Built a guided tutorial interface for Cloud Spanner, launching two tutorials alongside the free-trial experience to help new customers navigate the console.',
      'Increased team sprint productivity and reduced average code submission time by implementing a code review auto-assignment system.',
    ],
  },
  {
    company: 'Amazon Web Services',
    role: 'Software Development Engineer II',
    dates: 'Oct 2020 – Sep 2021',
    location: 'Seattle, WA',
    bullets: [
      'Reduced host costs by ~40% by re-designing AWS Secrets Manager’s load balancing infrastructure, with changes that also improved scalability and security.',
      'Analyzed live service availability issues and outages, assessed customer impact through gathered metrics, and presented solutions to the team and senior leadership as an on-call engineer.',
      'Mentored in a military apprenticeship program, coaching an apprentice with no prior experience through coding workshops and code reviews toward increasingly impactful changes to the code base.',
    ],
  },
  {
    company: 'Amazon Web Services',
    role: 'Software Development Engineer I',
    dates: 'Aug 2018 – Oct 2020',
    location: 'Seattle, WA',
    bullets: [
      'Designed and implemented an eventually consistent synchronization system between AWS Secrets Manager and AWS Config, enabling customers to audit secret configurations and identify security and compliance risks.',
      'Developed and maintained AWS Secrets Manager’s open-source .NET caching library on GitHub, allowing customers to client-side cache their credentials with a range of configuration options.',
      'Designed and implemented custom IAM restrictions on AWS Secrets Manager customer VPC endpoint policies, letting customers set their own security policy restrictions directly on their individual endpoints.',
    ],
  },
]

export const education = [
  {
    school: 'University of Southern California',
    degree: 'B.S. in Computer Science',
    dates: '2014 – 2018',
    location: 'Los Angeles, CA',
  },
]

export const skills = [
  { label: 'Languages', items: ['Java', 'Ruby', 'C#', 'C++', 'JavaScript'] },
  { label: 'Frameworks', items: ['Ruby on Rails', 'Spring', 'AngularJS', '.NET'] },
]
