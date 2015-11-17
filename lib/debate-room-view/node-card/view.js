import view from '../../view/mixin';
import template from './template.jade';
import render from '../../render/render.js';
import o from 'component-dom';
import t from 't-component';
import user from '../../user/user.js';
import closest from 'component-closest';
import confirm from 'democracyos-confirmation';
import nodeStore from '../../debate-room-store/node-store';
import NodeEdit from './node-edit/view.js';
import debug from 'debug';
const log = debug('democracyos:node-card:view');

export default class NodeCard extends view('appendable', 'emptyable', 'withEvents') {
  constructor (options) {
    options.template = template;

    var node = options.locals.node;
    options.locals.count = node.votes.filter(v => v.value == 'positive').length - node.votes.filter(v => v.value == 'negative').length;
    super(options);

    this.node = options.locals.node;

    ['onanyclick', 'onreplyclick', 'oneditclick', 'onremoveclick', 'onoptionclick', 'onmouseover', 'onmouseout', 'onvoteclick'].forEach(method => {
      this[method] = this[method].bind(this);
    });

    this.card = o(this.el).find('.node-card');
  }

  switchOn () {
    this.bind('click', '[data-reply-name]', this.onoptionclick);
    this.bind('click', '.node-reply-icon', this.onreplyclick);
    this.bind('click', '.node-edit-icon', this.oneditclick);
    this.bind('click', '.node-remove-icon', this.onremoveclick);
    this.bind('click', '.node-box', this.onanyclick);
    this.bind('click', '.vote', this.onvoteclick);
    this.bind('mouseover', '.node-box', this.onmouseover);
    this.bind('mouseout', '.node-box', this.onmouseout);
  }

  onanyclick (ev) {
    if (ev.defaultPrevented) return;

    if (this.card.find('.node-body-container').hasClass('clicked')) {
      this.unselectMe();
      this.tick();
      return;
    }

    if (this.card.find('.node-body-container').hasClass('selected')) {
      this.selectMe();
      this.tick();
      return;
    } 
  }

  unselectMe () {
    this.card.find('.read-more-link').addClass('hide');
    this.card.find('.node-body-container').removeClass('selected').removeClass('clicked');
  }

  selectMe () {
    var nbc = this.card.find('.node-body-container')[0];
    if (nbc.scrollHeight > nbc.style.maxHeight) {
      this.card.find('.read-more-link').removeClass('hide');
    }

    o('.node-body-container').removeClass('selected').removeClass('clicked');
    this.card.find('.node-body-container').addClass('selected').addClass('clicked');
    this.zoomToMe();
  }

  onreplyclick (ev) {
    ev.preventDefault();
    // render reply options
    if (this.card.find('.reply-options-container').hasClass('hide')) {
      this.selectMe();
    }
    
    this.card.find('.reply-options-container').toggleClass('hide');
    this.card.find('.reply-form-container').empty();
    this.tick();
  }

  onoptionclick (ev) {
    ev.preventDefault();
    // mark the current one as chosen
    this.card.find('[data-reply-name]').removeClass('chosen');
    o(closest(ev.target, '[data-reply-name]', true)).addClass('chosen');

    // get the edge type
    var edgeType = o(closest(ev.target, '[data-reply-name]', true)).attr('data-reply-name')

    // render the new comment block if not already there
    if (!this.nodeEdit) {
      var replyContainer = this.card.find('.reply-form-container');
      replyContainer.empty();

      this.nodeEdit = new NodeEdit({
        container: replyContainer[0],
        locals: {
          node: {}
        }
      });
    }

    this.nodeEdit.cancel = () => {
      this.card.find('[data-reply-name]').removeClass('chosen');
      this.nodeEdit = null;
      this.tick();
    };

    this.nodeEdit.submit = (data) => {
      data.edge = {
        target: this.node.id,
        type: edgeType
      };
      this.addNode(data);
      this.nodeEdit.oncancel();
      this.card.find('.reply-options-container').toggleClass('hide');
    };

    // adjust positions
    this.tick();
    if (user.logged()) this.nodeEdit.el.querySelector('textarea').focus();
  }

  onmouseover (ev) {
    o(ev.delegateTarget).find('.node-body-container').addClass('selected');
    if (!o('.node-body-container').hasClass('clicked')) this.moveMeUp();
    this.tick();
  }

  onmouseout (ev) {
    if (!o(ev.delegateTarget).find('.node-body-container').hasClass('clicked'))
      o(ev.delegateTarget).find('.node-body-container').removeClass('selected');
    this.tick();
  }

  oneditclick (ev) {
    ev.preventDefault();
    this.selectMe();

    // render the edit box
    var nodeBody = this.card.find('.node-body');
    this.card.find('.node-body').remove();

    if (this.nodeEdit) {
      this.nodeEdit.el.querySelector('textarea').focus();
      return;
    }

    this.nodeEdit = new NodeEdit({
      container: this.card.find('.node-body-container')[0],
      locals: {
        node: this.node
      }
    });

    this.nodeEdit.cancel = () => {
      this.nodeEdit = null;
      this.card.find('.node-body-container').append(nodeBody);
      this.switchOn();
    }

    this.nodeEdit.submit = (data) => {
      this.switchOn();
      this.nodeEdit.empty();
      this.nodeEdit = null;
      this.card.find('.node-body-container').append(nodeBody);
      this.card.find('.node-body-container').find('.node-body').text(data.node.body);
      this.editNode(data);
    }
  }

  onremoveclick (ev) {
    const onconfirmdelete = (ok) => {
      if (!ok) return;
      this.removeNode();
    };

    if (this.hasEdgesTo()) {
      let c = confirm(t('debate-room.comments.delete-not-allowed.title'), t('debate-room.comments.delete-not-allowed.body'))
        .ok(t('common.ok'))
        .modal()
        .closable()
        .effect('slide')
        .show();
      
      o(c.el).find('.cancel').addClass('hide');

    } else {
      confirm(t('debate-room.comments.confirmation.title'), t('debate-room.comments.delete.confirmation'))
        .cancel(t('debate-room.comments.cancel'))
        .ok(t('debate-room.comments.delete'))
        .modal()
        .closable()
        .effect('slide')
        .show(onconfirmdelete);
    }
  }

  onvoteclick (ev) {
    ev.preventDefault();
    this.selectMe();
    // vote, refresh voteCount
    var value = o(ev.delegateTarget).hasClass('up') ? 'positive' : 'negative';
    nodeStore
      .vote(this.node.id, value)
      .then(newNode => {
        this.nodes.vote = newNode.votes;
        var count = this.node.votes.filter(v => v.value == 'positive').length - this.node.votes.filter(v => v.value == 'negative').length;
        this.card.find('span.counter').text(count);
      })
      .catch(err => {
        log(err);
      });
  }
}
