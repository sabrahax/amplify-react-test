import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyTeamDrive',
  access: (allow) => ({
    '*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'protected/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'submissions/*': [
      allow.authenticated.to(['read', 'write'])
    ],
  })
});