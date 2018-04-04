import {Injector} from '@angular/core';
import {I18nToken} from 'core-app/angular4-transition-utils';
import {RelationResource} from '../../../api/api-v3/hal-resources/relation-resource.service';
import {
  WorkPackageResource,
  WorkPackageResourceInterface
} from '../../../api/api-v3/hal-resources/work-package-resource.service';
import {States} from '../../../states.service';
import {isRelationColumn, QueryColumn} from '../../../wp-query/query-column';
import {RelationColumnType} from '../../state/wp-table-relation-columns.service';
import {WorkPackageTable} from '../../wp-fast-table';
import {wpCellTdClassName} from '../cell-builder';
import {commonRowClassName, SingleRowBuilder, tableRowClassName} from '../rows/single-row-builder';

export function relationGroupClass(workPackageId:string) {
  return `__relations-expanded-from-${workPackageId}`;
}

export function relationIdentifier(targetId:string, workPackageId:string) {
  return `wp-relation-row-${workPackageId}-to-${targetId}`;
}

export const relationCellClassName = 'wp-table--relation-cell-td';

export class RelationRowBuilder extends SingleRowBuilder {

  public states:States = this.injector.get(States);
  public I18n:op.I18n = this.injector.get(I18nToken);

  constructor(public readonly injector:Injector,
              protected workPackageTable:WorkPackageTable) {

    super(injector, workPackageTable);
  }

  /**
   * For additional relation rows, we don't want to render an expandable relation cell,
   * but instead we render the relation label.
   * @param workPackage
   * @param column
   * @return {any}
   */
  public buildCell(workPackage:WorkPackageResourceInterface, column:QueryColumn):HTMLElement|null {

    // handle relation types
    if (isRelationColumn(column)) {
      return this.emptyRelationCell(column);
    }

    return super.buildCell(workPackage, column);
  }

  /**
   * Build the columns on the given empty row
   */
  public buildEmptyRelationRow(from:WorkPackageResourceInterface, relation:RelationResource, type:RelationColumnType):[HTMLElement, WorkPackageResourceInterface] {
    const denormalized = relation.denormalized(from);

    const to = this.states.workPackages.get(denormalized.targetId).value!;

    // Let the primary row builder build the row
    const row = this.createEmptyRelationRow(from, to);
    const [tr, _] = super.buildEmptyRow(to, row);

    return [tr, to];
  }

  /**
   * Create an empty unattached row element for the given work package
   * @param workPackage
   * @returns {any}
   */
  public createEmptyRelationRow(from:WorkPackageResourceInterface, to:WorkPackageResourceInterface) {
    const identifier = this.relationClassIdentifier(from, to);
    let tr = document.createElement('tr');
    tr.dataset['workPackageId'] = to.id;
    tr.dataset['classIdentifier'] = identifier;

    tr.classList.add(
      commonRowClassName, tableRowClassName, 'issue',
      `wp-table--relations-aditional-row`,
      identifier,
      `${identifier}-table`,
      relationGroupClass(from.id)
    );

    return tr;
  }

  public relationClassIdentifier(from:WorkPackageResourceInterface, to:WorkPackageResourceInterface) {
    return relationIdentifier(to.id, from.id);
  }

  /**
   *
   * @param from
   * @param denormalized
   * @param type
   */
  public appendRelationLabel(jRow:JQuery, from:WorkPackageResourceInterface, relation:RelationResource, columnId:string, type:RelationColumnType) {
    const denormalized = relation.denormalized(from);
    let typeLabel = '';

    // Add the relation label if this is a "Relations for <WP Type>" column
    if (type === 'toType') {
      typeLabel = this.I18n.t(`js.relation_labels.${denormalized.reverseRelationType}`);
    }
    // Add the WP type label if this is a "<Relation Type> Relations" column
    if (type === 'ofType') {
      const wp = this.states.workPackages.get(denormalized.target.id).value!;
      typeLabel = wp.type.name;
    }

    const relationLabel = document.createElement('span');
    relationLabel.classList.add('relation-row--type-label');
    relationLabel.textContent = typeLabel;

    const textNode = document.createTextNode(denormalized.target.name);

    jRow.find(`.${relationCellClassName}`).empty();
    jRow.find(`.${relationCellClassName}.${columnId}`).append(relationLabel);
  }

  protected emptyRelationCell(column:QueryColumn) {
    const cell = document.createElement('td');
    cell.classList.add(relationCellClassName, wpCellTdClassName, column.id);

    return cell;
  }
}
