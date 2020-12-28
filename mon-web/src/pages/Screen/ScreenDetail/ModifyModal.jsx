import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input } from 'antd';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import ModalControl from '@pkgs/ModalControl';

const FormItem = Form.Item;

class ModifyModal extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
    visible: PropTypes.bool,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    destroy: PropTypes.func,
  };

  static defaultProps = {
    title: '',
    visible: true,
    onOk: _.noop,
    onCancel: _.noop,
    destroy: _.noop,
  };

  handleOk = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk(values);
        this.props.destroy();
      }
    });
  }

  handleCancel = () => {
    this.props.destroy();
  }

  render() {
    const { title, visible } = this.props;
    const { getFieldDecorator } = this.props.form;

    return (
      <Modal
        title={title}
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Form layout="vertical" onSubmit={(e) => {
          e.preventDefault();
          this.handleOk();
        }}>
          <FormItem label={<FormattedMessage id="table.name" />}>
            {getFieldDecorator('name', {
              initialValue: this.props.name,
              rules: [{ required: true, message: '必填项！' }],
            })(
              <Input />,
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ModalControl(Form.create()(ModifyModal));
