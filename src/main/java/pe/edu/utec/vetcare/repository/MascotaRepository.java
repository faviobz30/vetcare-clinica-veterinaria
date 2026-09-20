package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.MascotaEntity;

import java.util.List;

public interface MascotaRepository
        extends JpaRepository<MascotaEntity, Long> {

    List<MascotaEntity>
    findByPropietarioIdPropietario(Long idPropietario);
}