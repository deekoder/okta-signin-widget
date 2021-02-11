/*!
 * Copyright (c) 2020, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

// BaseLoginRouter contains the more complicated router logic - rendering/
// transition, etc. Most router changes should happen in LoginRouter (which is
// responsible for adding new routes)

import idx from '@okta/okta-idx-js';

import { getTransactionMeta, saveTransactionMeta } from './transactionMeta';

// Begin or resume a transaction using an interactionHandle
export async function interact (settings) {
  const clientId = settings.get('clientId');
  const domain = settings.get('baseUrl');
  const scopes = settings.get('scopes');
  const redirectUri = settings.get('redirectUri');
  const version = settings.get('apiVersion');

  let meta = await getTransactionMeta(settings);
  const { interactionHandle, codeVerifier, codeChallenge, codeChallengeMethod } = meta;

  return idx.start({ 
    clientId, 
    issuer: domain + '/oauth2/default', 
    scopes, 
    interactionHandle, // if interactionHandle is undefined, idx will bootstrap a new interactionHandle
    redirectUri, 
    version,
    codeVerifier,
    codeChallenge,
    codeChallengeMethod
  })
    .then(response => {
      // If this is a new transaction an interactionHandle was returned
      if (!interactionHandle && response.toPersist.interactionHandle) {
        meta = Object.assign({}, meta, {
          interactionHandle: response.toPersist.interactionHandle
        });
      }

      // Save transaction meta so it can be resumed
      saveTransactionMeta(settings, meta);


      // return idx response
      return response;
    });
}
