import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyTeamDrive',
  access: (allow) => ({
    'files/${cognito-identity.amazonaws.com:sub}/*': [
      allow.identityBased.to(['read', 'write', 'delete'])
    ],
    'submissions/*': [
      allow.authenticated.to(['read', 'write'])
    ],
  })
});