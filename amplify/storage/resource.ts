import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyTeamDrive',
  access: (allow) => ({
    '/*': [
      ],
    'submissions/*': [
      allow.authenticated.to(['read', 'write'])
    ],
  })
});