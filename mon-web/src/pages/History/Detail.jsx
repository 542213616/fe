/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import { Card, Table, Divider, Popconfirm, Icon, message } from 'antd';
import { Link } from 'react-router-dom';
import moment from 'moment';
import _ from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import Graph, { Info } from '@pkgs/Graph';
import CreateIncludeNsTree from '@pkgs/Layout/CreateIncludeNsTree';
import { prefixCls, priorityOptions, eventTypeOptions } from '@common/config';
import request from '@pkgs/request';
import api from '@common/api';
import PodStatusEvent from '@pkgs/ccp/PodStatusEvent';
import './style.less';

export function normalizeGraphData(data) {
  const cloneData = _.cloneDeep(data);
  _.each(cloneData.metrics, (item) => {
    delete item.key;
    delete item.metrics;
    delete item.tagkv;
    delete item.counterList;
  });
  return cloneData;
}

const nPrefixCls = `${prefixCls}-history`;
// eslint-disable-next-line react/prefer-stateless-function
class Detail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // loading: false,
      data: undefined,
    };
  }

  componentDidMount() {
    this.fetchData(this.props);
  }

  componentWillReceiveProps = (nextProps) => {
    const historyType = _.get(this.props, 'match.params.historyType');
    const nextHistoryType = _.get(nextProps, 'match.params.historyType');
    const historyId = _.get(this.props, 'match.params.historyId');
    const nextHistoryId = _.get(nextProps, 'match.params.historyId');

    if (historyType !== nextHistoryType || historyId !== nextHistoryId) {
      this.fetchData(nextProps);
    }
  }

  fetchData(props) {
    const historyType = _.get(props, 'match.params.historyType');
    const historyId = _.get(props, 'match.params.historyId');

    if (historyType && historyId) {
      // this.setState({ loading: true });
      request(`${api.event}/${historyType}/${historyId}`).then((res) => {
        this.setState({ data: res });
      }).finally(() => {
        // this.setState({ loading: false });
      });
    }
  }

  handleClaim = (id) => {
    request(`${api.event}/cur/claim`, {
      method: 'POST',
      body: JSON.stringify({ id: _.toNumber(id) }),
    }).then(() => {
      message.success('认领报警成功！');
      this.fetchData();
    });
  }

  handleShareGraph = (graphData) => {
    const data = normalizeGraphData(graphData);
    const configsList = [{
      configs: JSON.stringify(data),
    }];
    request(api.tmpchart, {
      method: 'POST',
      body: JSON.stringify(configsList),
    }).then((res) => {
      window.open(`/mon/tmpchart?id=${_.join(res, ',')}`, '_blank');
    });
  }

  render() {
    const { data } = this.state;
    const detail = _.get(data, 'detail[0]');

    if (!data || !detail) return null;
    const now = (new Date()).getTime();
    let etime = data.etime * 1000;
    let stime = etime - 7200000;

    if (now - etime > 3600000) {
      stime = etime - 3600000;
      etime += 3600000;
    }

    const xAxisPlotLines = _.map(detail.points, (point) => {
      return {
        value: point.timestamp * 1000,
        color: 'red',
      };
    });

    let selectedTagkv = [{
      tagk: 'endpoint',
      tagv: [data.endpoint],
    }];

    if (data.tags) {
      selectedTagkv = _.concat(selectedTagkv, _.map(detail.tags, (value, key) => {
        return {
          tagk: key,
          tagv: [value],
        };
      }));
    }

    const historyType = _.get(this.props, 'match.params.historyType');
    const historyId = _.get(this.props, 'match.params.historyId');
    const { nid } = data;
    const points = [];
    const graphData = _.map(data.detail, (item) => {
      points.push({
        metric: item.metric,
        points: item.points,
      });
      return {
        id: _.toNumber(_.uniqueId()),
        start: stime,
        end: etime,
        xAxis: {
          plotLines: xAxisPlotLines,
        },
        metrics: [{
          selectedNid: data.nid,
          selectedEndpoint: data.category === 1 ? [data.endpoint] : data.cur_id,
          selectedMetric: item.metric,
          selectedTagkv,
          endpointsKey: data.category === 1 ? 'endpoints' : 'nids',
        }],
      };
    });

    return (
      <div className={nPrefixCls}>
        {
          _.map(graphData, (item) => {
            return (
              <div key={item.id} style={{ border: '1px solid #e8e8e8', marginTop: 10 }}>
                <Graph
                  height={250}
                  graphConfigInnerVisible={false}
                  data={item}
                  extraRender={(graph) => {
                    return [
                      <span className="graph-operationbar-item" key="info">
                        <Info
                          graphConfig={graph.getGraphConfig(graph.props.data)}
                          counterList={graph.counterList}
                        >
                          <Icon type="info-circle-o" />
                        </Info>
                      </span>,
                      <span className="graph-extra-item" key="more">
                        <Icon type="arrows-alt" onClick={() => { this.handleShareGraph(item); }} />
                      </span>,
                    ];
                  }}
                />
              </div>
            );
          })
        }
        <div className={`${nPrefixCls}-detail mt10`}>
          <Card
            title={<FormattedMessage id="event.table.detail.title" />}
            bodyStyle={{
              padding: '10px 16px',
            }}
            extra={
              <span>
                <Link to={{
                  pathname: '/silence/add',
                  search: `${historyType}=${historyId}&nid=${nid}`,
                }}>
                  <FormattedMessage id="event.table.shield" />
                </Link>
                {
                  historyType === 'cur' ?
                    <span>
                      <Divider type="vertical" />
                      <Popconfirm title={<FormattedMessage id="event.table.claim.sure" />} onConfirm={() => this.handleClaim(historyId)}>
                        <a><FormattedMessage id="event.table.claim" /></a>
                      </Popconfirm>
                    </span> : null
                }
              </span>
            }
          >
            <div className={`${nPrefixCls}-detail-list`}>
              <div>
                <span className="label"><FormattedMessage id="event.table.stra" />：</span>
                <Link target="_blank" to={{ pathname: `/strategy/${data.sid}` }}>{data.sname}</Link>
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.status" />：</span>
                {_.get(_.find(priorityOptions, { value: data.priority }), 'label')}
                <span style={{ paddingLeft: 8 }}>{_.get(_.find(eventTypeOptions, { value: data.event_type }), 'value')}</span>
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.notify" />：</span>
                {_.join(data.status, ', ')}
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.time" />：</span>
                {moment.unix(data.etime).format('YYYY-MM-DD HH:mm:ss')}
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.node" />：</span>
                {data.node_path}
              </div>
              {
                data.category === 1 ?
                  <div>
                    <span className="label">Endpoint：</span>
                    <PodStatusEvent endpoint={data.endpoint} />
                  </div> :
                  <div>
                    <span className="label">所属节点：</span>
                    {data.cur_node_path}
                  </div>
              }
              <div>
                <span className="label"><FormattedMessage id="event.table.metric" />：</span>
                {_.get(data.detail, '[0].metric')}
              </div>
              <div>
                <span className="label">Tags：</span>
                {data.tags}
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.runbook" />：</span>
                {data.runbook}
              </div>
              <div>
                <span className="label"><FormattedMessage id="event.table.expression" />：</span>
                {data.info}
              </div>
              {
                _.map(points, (item) => {
                  return (
                    <div key={item.metric}>
                      <span className="label"><FormattedMessage id="event.table.scene" />：</span>
                      <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                        <div>{item.metric}</div>
                        <Table
                          rowKey="timestamp"
                          size="small"
                          dataSource={item.points}
                          columns={[
                            {
                              title: <FormattedMessage id="event.table.scene.time" />,
                              dataIndex: 'timestamp',
                              width: 200,
                              render(text) {
                                return <span>{moment.unix(text).format('YYYY-MM-DD HH:mm:ss')}</span>;
                              },
                            }, {
                              title: <FormattedMessage id="event.table.scene.value" />,
                              dataIndex: 'value',
                            }, {
                              title: 'Extra',
                              dataIndex: 'extra',
                            },
                          ]}
                          pagination={false}
                        />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </Card>
        </div>
      </div>
    );
  }
}

export default CreateIncludeNsTree(injectIntl(Detail));
