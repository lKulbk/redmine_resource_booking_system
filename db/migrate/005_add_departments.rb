class AddDepartments < ActiveRecord::Migration[4.2]

  def self.up
    add_column :rrbs_settings, :departments, :text
  end

  def self.down
    remove_column :rrbs_settings, :departments
  end

end
