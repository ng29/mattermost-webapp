// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

export function createNewTeamAndMoveToOffTopic(teamName, sidebarItemClass) {
    // # Start with a new team
    cy.createNewTeam(teamName, teamName);

    // * Verify that we've switched to the new team
    cy.get('#headerTeamName').should('be.visible').should('be.visible').should('contain', teamName);

    // # Click on Off Topic
    cy.get(`${sidebarItemClass}:contains(Off-Topic)`).should('be.visible').click();

    // * Verify that the channel changed
    cy.url().should('include', `/${teamName}/channels/off-topic`);
    cy.get('#channelHeaderTitle').should('be.visible').should('contain', 'Off-Topic');
}

export function removeMeFromCurrentChannel() {
    // # Remove the Guest User from channel
    let channelId;
    return cy.getCurrentChannelId().then((res) => {
        channelId = res;
        return cy.apiGetMe();
    }).then((res) => {
        const userId = res.body.id;
        return cy.removeUserFromChannel(channelId, userId);
    });
}

export function verifyRHS(teamName, sidebarItemClass, postId) {
    // # Dismiss the modal informing the user they were kicked out
    cy.get('#removedChannelBtn').click();

    // * Verify that the channel changed back to Town Square
    cy.url().should('include', `/${teamName}/channels/town-square`);
    cy.get('#channelHeaderTitle').should('be.visible').should('contain', 'Town Square');

    // * Verify that Off-Topic has been removed
    cy.get(`${sidebarItemClass}:contains(Off-Topic)`).should('not.exist');

    // * Verify that the recently posted message is no longer in the RHS
    cy.get(`#rhsPostMessageText_${postId}`).should('not.exist');
}

export function shouldRemoveMentionsInRHS(teamName, sidebarItemClass) {
    let postId;

    // # Post a unique message with a mention and retrieve its ID
    cy.apiGetMe().then((res) => {
        var messageText = `${Date.now()} - mention to @${res.body.username} `;
        cy.postMessage(messageText);

        return cy.getLastPostId();
    }).then((lastPostId) => {
        postId = lastPostId;

        // # Click on the Recent Mentions button to open the RHS
        cy.get('#channelHeaderMentionButton').click();

        // * Verify that the recently posted message is shown in the RHS
        cy.get(`#rhsPostMessageText_${postId}`).should('exist');

        return removeMeFromCurrentChannel();
    }).then(() => {
        verifyRHS(teamName, sidebarItemClass, postId);
    });
}

export function shouldRemoveFlaggedPostsInRHS(teamName, sidebarItemClass) {
    let postId;

    // # Post a unique message and retrieve its ID
    var messageText = `${Date.now()} - post to flag`;
    cy.postMessage(messageText);

    cy.getLastPostId().then((lastPostId) => {
        postId = lastPostId;

        // # Flag the last post
        cy.clickPostFlagIcon(postId);

        // # Click on the Flagged Posts button to open the RHS
        cy.get('#channelHeaderFlagButton').click();

        // * Verify that the recently posted message is shown in the RHS
        cy.get(`#rhsPostMessageText_${postId}`).should('exist');

        return removeMeFromCurrentChannel();
    }).then(() => {
        verifyRHS(teamName, sidebarItemClass, postId);
    });
}
