import React from 'react';
import {
  Form, Input, Icon, Col, Row,
} from 'antd';
import _ from 'lodash';
import { useDynamicList } from '@umijs/hooks';

interface IParams {
  hasLabel?: boolean;
  data: {
    name: string;
    label: string;
    description: string;
    required: true;
    type: string;
    example: string;
  };
  getFieldDecorator: any;
  initialValues: any;
}

export default (props: IParams) => {
  const {
    list, remove, getKey, push,
  } = useDynamicList(_.get(props.initialValues, props.data.name, ['']));
  const {
    name, description, example, required,
  } = props.data;
  const Rows = (index: number, item: any) => (
    <Row key={`${name}[${getKey(index)}]`}>
      <Col span={21}>
        <Form.Item>
          {props.getFieldDecorator(`${name}[${getKey(index)}]`, {
            initialValue: item,
            rules: [
              {
                required,
                message: description,
              },
            ],
          })(
            <Input placeholder={example} />,
          )}
        </Form.Item>
      </Col>
      <Col span={3}>
        {list.length > 1 && (
          <Icon
            type="minus-circle-o"
            style={{ marginLeft: 8 }}
            onClick={() => {
              remove(index);
            }}
          />
        )}
        <Icon
          type="plus-circle-o"
          style={{ marginLeft: 8 }}
          onClick={() => {
            push('');
          }}
        />
      </Col>
    </Row>
  );
  return <>{list.map((ele: any, index: any) => Rows(index, ele))}</>;
};
