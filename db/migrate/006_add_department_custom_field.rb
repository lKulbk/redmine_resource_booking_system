class AddDepartmentCustomField < ActiveRecord::Migration[4.2]

  def self.up
    add_column :rrbs_settings, :custom_field_id_department, :integer
  end

  def self.down
    remove_column :rrbs_settings, :custom_field_id_department
  end

end
