import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyTeamDrive',
  access: (allow) => ({
    'files/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    'submissions/*': [
      allow.authenticated.to(['read', 'write'])
    ],
  })
});